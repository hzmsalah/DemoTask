using System.ComponentModel.DataAnnotations;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Dtos;

public record CustomerCreateDto(
    [param: Required(ErrorMessage = ValidationCodes.FullNameRequired)]
    [param: StringLength(150, MinimumLength = 2, ErrorMessage = ValidationCodes.FullNameLength)]
    string? FullName,
    [param: Required(ErrorMessage = ValidationCodes.PhoneNumberRequired)]
    [param: ValidPhoneNumber(ErrorMessage = ValidationCodes.PhoneNumberInvalid)]
    string? PhoneNumber,
    [param: EmailAddress(ErrorMessage = ValidationCodes.EmailInvalid)]
    [param: StringLength(100, ErrorMessage = ValidationCodes.EmailTooLong)]
    string? Email,
    [param: StringLength(250, ErrorMessage = ValidationCodes.AddressTooLong)]
    string? Address);

public record CustomerUpdateDto(
    [param: Required(ErrorMessage = ValidationCodes.FullNameRequired)]
    [param: StringLength(150, MinimumLength = 2, ErrorMessage = ValidationCodes.FullNameLength)]
    string? FullName,
    [param: Required(ErrorMessage = ValidationCodes.PhoneNumberRequired)]
    [param: ValidPhoneNumber(ErrorMessage = ValidationCodes.PhoneNumberInvalid)]
    string? PhoneNumber,
    [param: EmailAddress(ErrorMessage = ValidationCodes.EmailInvalid)]
    [param: StringLength(100, ErrorMessage = ValidationCodes.EmailTooLong)]
    string? Email,
    [param: StringLength(250, ErrorMessage = ValidationCodes.AddressTooLong)]
    string? Address);

public record CustomerReadDto(Guid Id, string FullName, string PhoneNumber, string? Email, string? Address, DateTimeOffset CreatedAt, DateTimeOffset? LastVisit);

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int PageNumber, int PageSize)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
