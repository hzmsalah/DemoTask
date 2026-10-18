using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkspaceApi.Data;
using WorkspaceApi.Dtos;
using WorkspaceApi.Models;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Tests;

[Collection("sqlserver")]
public sealed class CustomersControllerTests(SqlServerFixture fixture) : IAsyncLifetime
{
    private readonly CustomersApiFactory factory = new(fixture);
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Customers.ExecuteDeleteAsync();
    }

    public Task DisposeAsync()
    {
        client.Dispose();
        factory.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task Database_rejects_a_last_visit_before_the_first_visit()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var firstVisit = DateTimeOffset.UtcNow.AddDays(-1);
        db.Customers.Add(new Customer
        {
            FullName = "Invalid Visit Order",
            FullNameSearch = "Invalid Visit Order",
            PhoneNumber = "+201055000001",
            CreatedAt = firstVisit,
            LastVisit = firstVisit.AddDays(-1)
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task Create_get_update_delete_round_trip_protects_server_managed_fields()
    {
        var suppliedId = Guid.NewGuid();
        var submittedAt = DateTimeOffset.UtcNow;
        using var response = await client.PostAsJsonAsync("/api/customers", new
        {
            fullName = "  Test   Customer ",
            phoneNumber = "01012345678",
            email = "test@example.com",
            address = "Cairo",
            id = suppliedId,
            createdAt = submittedAt.AddYears(-10),
            lastVisit = submittedAt
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CustomerReadDto>();
        Assert.NotNull(created);
        Assert.NotEqual(suppliedId, created!.Id);
        Assert.Equal("Test Customer", created.FullName);
        Assert.Equal("+201012345678", created.PhoneNumber);
        Assert.True(created.CreatedAt >= submittedAt.AddMinutes(-1));
        Assert.Null(created.LastVisit);
        Assert.NotNull(response.Headers.Location);

        using var update = await client.PutAsJsonAsync($"/api/customers/{created.Id}", new
        {
            fullName = "Updated أحمد Customer",
            phoneNumber = "+201012345678",
            email = (string?)null,
            address = (string?)null
        });
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        using var get = await client.GetAsync($"/api/customers/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var changed = await get.Content.ReadFromJsonAsync<CustomerReadDto>();
        Assert.NotNull(changed);
        Assert.Equal("Updated أحمد Customer", changed!.FullName);
        Assert.Null(changed.Email);
        Assert.Null(changed.Address);
        Assert.Equal(created.CreatedAt, changed.CreatedAt);
        Assert.Equal(created.LastVisit, changed.LastVisit);
        Assert.Equal(created.Id, Assert.Single((await SearchAsync("احمد")).Items).Id);
        Assert.Empty((await SearchAsync("Test")).Items);

        using var delete = await client.DeleteAsync($"/api/customers/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/customers/{created.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/customers/{Guid.NewGuid()}")).StatusCode);
    }

    [Fact]
    public async Task Duplicate_phone_returns_conflict_code_and_equivalent_phone_is_allowed_on_update()
    {
        var first = await CreateCustomerAsync("First Customer", "01012345678");
        using var duplicate = await client.PostAsJsonAsync("/api/customers", new { fullName = "Second Customer", phoneNumber = "+201012345678" });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var problem = await duplicate.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal([ValidationCodes.PhoneNumberDuplicate], problem!.Errors[nameof(CustomerCreateDto.PhoneNumber)]);

        using var sameNumberUpdate = await client.PutAsJsonAsync($"/api/customers/{first.Id}", new
        {
            fullName = "First Customer Updated",
            phoneNumber = "+20 101 234 5678",
            email = (string?)null,
            address = (string?)null
        });
        Assert.Equal(HttpStatusCode.NoContent, sameNumberUpdate.StatusCode);

        var second = await CreateCustomerAsync("Second Customer", "+966501234567");
        using var conflictingUpdate = await client.PutAsJsonAsync($"/api/customers/{second.Id}", new
        {
            fullName = "Second Customer",
            phoneNumber = "01012345678",
            email = (string?)null,
            address = (string?)null
        });
        Assert.Equal(HttpStatusCode.Conflict, conflictingUpdate.StatusCode);
    }

    [Fact]
    public async Task Get_returns_paged_envelope_clamps_bounds_and_orders_tied_rows_stably()
    {
        await CreateCustomerAsync("First Customer", "01012345678");
        await CreateCustomerAsync("Second Customer", "01022334455");
        await CreateCustomerAsync("Third Customer", "01033445566");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var tiedTimestamp = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
            await db.Customers.ExecuteUpdateAsync(update => update.SetProperty(customer => customer.CreatedAt, tiedTimestamp));
        }

        using var firstPageResponse = await client.GetAsync("/api/customers?page=1&pageSize=2");
        Assert.Equal(HttpStatusCode.OK, firstPageResponse.StatusCode);
        var firstPage = await firstPageResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(firstPage);
        Assert.Equal(3, firstPage!.TotalCount);
        Assert.Equal(1, firstPage.PageNumber);
        Assert.Equal(2, firstPage.PageSize);
        Assert.Equal(2, firstPage.TotalPages);
        Assert.Equal(2, firstPage.Items.Count);
        Assert.True(firstPage.HasNextPage);

        using var secondPageResponse = await client.GetAsync("/api/customers?page=2&pageSize=2");
        var secondPage = await secondPageResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(secondPage);
        Assert.Single(secondPage!.Items);
        Assert.False(secondPage.HasNextPage);
        Assert.True(secondPage.HasPreviousPage);

        using var pastEndResponse = await client.GetAsync("/api/customers?page=3&pageSize=2");
        var pastEnd = await pastEndResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(pastEnd);
        Assert.Empty(pastEnd!.Items);
        Assert.Equal(3, pastEnd.TotalCount);
        Assert.Equal(2, pastEnd.TotalPages);

        using var defaultsResponse = await client.GetAsync("/api/customers?page=0&pageSize=0");
        var defaults = await defaultsResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(defaults);
        Assert.Equal(1, defaults!.PageNumber);
        Assert.Equal(1, defaults.PageSize);

        using var clampedResponse = await client.GetAsync("/api/customers?page=0&pageSize=1000");
        var clamped = await clampedResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(clamped);
        Assert.Equal(1, clamped!.PageNumber);
        Assert.Equal(100, clamped.PageSize);

        var observedIds = new List<Guid>();
        for (var page = 1; page <= 3; page++)
        {
            using var response = await client.GetAsync($"/api/customers?page={page}&pageSize=1");
            var envelope = await response.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
            Assert.NotNull(envelope);
            observedIds.Add(Assert.Single(envelope!.Items).Id);
        }
        Assert.Equal(3, observedIds.Distinct().Count());
        using var firstPageAgainResponse = await client.GetAsync("/api/customers?page=1&pageSize=1");
        var firstPageAgain = await firstPageAgainResponse.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(firstPageAgain);
        Assert.Equal(observedIds[0], Assert.Single(firstPageAgain!.Items).Id);
    }

    [Fact]
    public async Task Search_runs_on_the_api_for_partial_names_and_international_phone_fragments()
    {
        var egypt = await CreateCustomerAsync("Mona 100% Studio أحمد إبراهيم آدم مُحَمَّد فاطمة علي", "01012345678");
        var saudi = await CreateCustomerAsync("Ahmed_Test", "+966501234567");
        var china = await CreateCustomerAsync("李小龙", "+8613812345678");

        Assert.Equal(egypt.Id, Assert.Single((await SearchAsync("mOnA")).Items).Id);
        foreach (var search in new[] { "احمد", "ابراهيم", "ادم", "محمد", "فاطمه", "على" })
        {
            Assert.Equal(egypt.Id, Assert.Single((await SearchAsync(search)).Items).Id);
        }
        foreach (var search in new[] { "0101", "+20 101", "0020101", "٠١٠١" })
        {
            Assert.Equal(egypt.Id, Assert.Single((await SearchAsync(search)).Items).Id);
        }
        foreach (var search in new[] { "050123", "+966 50", "00966 50" })
        {
            Assert.Equal(saudi.Id, Assert.Single((await SearchAsync(search)).Items).Id);
        }
        Assert.Equal(china.Id, Assert.Single((await SearchAsync("+86 138")).Items).Id);
        Assert.Equal(egypt.Id, Assert.Single((await SearchAsync("%")).Items).Id);
        Assert.Equal(saudi.Id, Assert.Single((await SearchAsync("_")).Items).Id);
        Assert.Empty((await SearchAsync("Ahmed 010")).Items);
        Assert.Empty((await SearchAsync("-")).Items);

        foreach (var (customer, name, phone) in new[]
        {
            (saudi, "Saudi Customer Updated", "+966501234567"),
            (china, "China Customer Updated", "+8613812345678")
        })
        {
            using var update = await client.PutAsJsonAsync($"/api/customers/{customer.Id}", new { fullName = name, phoneNumber = phone });
            Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
            Assert.Equal(customer.Id, Assert.Single((await SearchAsync(name)).Items).Id);
            using var delete = await client.DeleteAsync($"/api/customers/{customer.Id}");
            Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/customers/{customer.Id}")).StatusCode);
        }
    }

    [Fact]
    public async Task Responses_have_security_headers_and_cors_is_allowlisted()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/customers");
        request.Headers.Add("Origin", "http://localhost:3000");
        using var response = await client.SendAsync(request);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    private async Task<CustomerReadDto> CreateCustomerAsync(string name, string phone)
    {
        using var response = await client.PostAsJsonAsync("/api/customers", new { fullName = name, phoneNumber = phone });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var customer = await response.Content.ReadFromJsonAsync<CustomerReadDto>();
        Assert.NotNull(customer);
        return customer!;
    }

    private async Task<PagedResult<CustomerReadDto>> SearchAsync(string search)
    {
        using var response = await client.GetAsync($"/api/customers?search={Uri.EscapeDataString(search)}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<CustomerReadDto>>();
        Assert.NotNull(result);
        return result!;
    }
}
