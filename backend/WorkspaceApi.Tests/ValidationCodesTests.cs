using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using WorkspaceApi.Dtos;
using Microsoft.AspNetCore.Mvc;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Tests;

[Collection("sqlserver")]
public sealed class ValidationCodesTests(SqlServerFixture fixture) : IAsyncLifetime
{
    private readonly CustomersApiFactory factory = new(fixture);
    private HttpClient client = null!;

    public Task InitializeAsync()
    {
        client = factory.CreateClient();
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        client.Dispose();
        factory.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public void Backend_codes_match_the_shared_contract_exactly()
    {
        var root = FindRepositoryRoot();
        var expected = JsonSerializer.Deserialize<string[]>(File.ReadAllText(Path.Combine(root.FullName, "shared", "validation-codes.json")));
        Assert.NotNull(expected);
        Assert.Equal(expected!.Order(StringComparer.Ordinal), ValidationCodes.All.Order(StringComparer.Ordinal));
    }

    [Fact]
    public async Task Invalid_fields_return_only_known_validation_codes()
    {
        using var response = await client.PostAsJsonAsync("/api/customers", new
        {
            fullName = "a",
            phoneNumber = "not a phone",
            email = "not-an-email",
            address = new string('x', 251)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var details = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(details);
        Assert.Contains(ValidationCodes.FullNameLength, details!.Errors[nameof(CustomerCreateDto.FullName)]);
        Assert.Contains(ValidationCodes.PhoneNumberInvalid, details.Errors[nameof(CustomerCreateDto.PhoneNumber)]);
        Assert.Contains(ValidationCodes.EmailInvalid, details.Errors[nameof(CustomerCreateDto.Email)]);
        Assert.Contains(ValidationCodes.AddressTooLong, details.Errors[nameof(CustomerCreateDto.Address)]);
        Assert.All(details.Errors.Values.SelectMany(codes => codes), code => Assert.Contains(code, ValidationCodes.All));
    }

    [Fact]
    public async Task Malformed_json_returns_generic_validation_details_without_raw_parser_text()
    {
        using var content = new StringContent("{", Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("/api/customers", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.False(body.Contains("JsonException", StringComparison.OrdinalIgnoreCase));
        Assert.False(body.Contains("Unexpected end", StringComparison.OrdinalIgnoreCase));
        using var document = JsonDocument.Parse(body);
        Assert.Empty(document.RootElement.GetProperty("errors").EnumerateObject());
    }

    private static DirectoryInfo FindRepositoryRoot()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "shared", "validation-codes.json")))
        {
            root = root.Parent;
        }
        return root ?? throw new DirectoryNotFoundException("Repository shared contract was not found.");
    }
}
