using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.Json;
using WorkspaceApi.Dtos;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Tests;

public sealed class CustomerValidationTests
{
    [Fact]
    public void Full_name_is_required_and_limited()
    {
        var dto = new CustomerCreateDto(null, null, null, null);
        Assert.Contains(ValidationCodes.FullNameRequired, ValidateParameter(dto, nameof(CustomerCreateDto.FullName), null));
        Assert.Contains(ValidationCodes.FullNameLength, ValidateParameter(dto, nameof(CustomerCreateDto.FullName), "a"));
        Assert.Contains(ValidationCodes.FullNameLength, ValidateParameter(dto, nameof(CustomerCreateDto.FullName), new string('x', 151)));
    }

    [Fact]
    public void Phone_number_is_required_and_must_be_valid()
    {
        var dto = new CustomerCreateDto(null, null, null, null);
        Assert.Contains(ValidationCodes.PhoneNumberRequired, ValidateParameter(dto, nameof(CustomerCreateDto.PhoneNumber), null));
        Assert.Contains(ValidationCodes.PhoneNumberInvalid, ValidateParameter(dto, nameof(CustomerCreateDto.PhoneNumber), "bad"));
    }

    [Fact]
    public void Optional_fields_allow_null_but_length_and_email_are_checked()
    {
        var dto = new CustomerCreateDto("Valid Name", "01012345678", null, null);
        Assert.Empty(ValidateParameter(dto, nameof(CustomerCreateDto.Email), null));
        Assert.Empty(ValidateParameter(dto, nameof(CustomerCreateDto.Address), null));
        Assert.Contains(ValidationCodes.EmailInvalid, ValidateParameter(dto, nameof(CustomerCreateDto.Email), "bad"));
        Assert.Contains(ValidationCodes.EmailTooLong, ValidateParameter(dto, nameof(CustomerCreateDto.Email), new string('x', 101)));
        Assert.Contains(ValidationCodes.AddressTooLong, ValidateParameter(dto, nameof(CustomerCreateDto.Address), new string('x', 251)));
    }

    [Fact]
    public void Code_set_matches_shared_contract()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "shared", "validation-codes.json"))) root = root.Parent;
        Assert.NotNull(root);
        var expected = JsonSerializer.Deserialize<HashSet<string>>(File.ReadAllText(Path.Combine(root!.FullName, "shared", "validation-codes.json")))!;
        Assert.Equal(expected.Order(), ValidationCodes.All.Order());
    }

    private static string[] ValidateParameter<TDto>(TDto dto, string parameterName, object? value)
    {
        var parameter = typeof(TDto).GetConstructors()
            .Single()
            .GetParameters()
            .Single(candidate => string.Equals(candidate.Name, parameterName, StringComparison.OrdinalIgnoreCase));
        var results = new List<ValidationResult>();
        var context = new ValidationContext(dto!) { MemberName = parameter.Name };
        Validator.TryValidateValue(value, context, results, parameter.GetCustomAttributes<ValidationAttribute>());
        return results.Select(result => result.ErrorMessage ?? string.Empty).ToArray();
    }
}
