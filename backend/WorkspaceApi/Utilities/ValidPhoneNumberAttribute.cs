using System.ComponentModel.DataAnnotations;

namespace WorkspaceApi.Utilities;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class ValidPhoneNumberAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        return value is string phone && PhoneNumberSanitizer.TryNormalize(phone, out _)
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage ?? ValidationCodes.PhoneNumberInvalid);
    }
}
