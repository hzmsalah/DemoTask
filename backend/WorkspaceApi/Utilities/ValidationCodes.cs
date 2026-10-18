namespace WorkspaceApi.Utilities;

public static class ValidationCodes
{
    public const string FullNameRequired = "fullName.required";
    public const string FullNameLength = "fullName.length";
    public const string PhoneNumberRequired = "phoneNumber.required";
    public const string PhoneNumberInvalid = "phoneNumber.invalid";
    public const string PhoneNumberDuplicate = "phoneNumber.duplicate";
    public const string EmailInvalid = "email.invalid";
    public const string EmailTooLong = "email.tooLong";
    public const string AddressTooLong = "address.tooLong";

    public static IReadOnlySet<string> All { get; } = new HashSet<string>(StringComparer.Ordinal)
    {
        FullNameRequired, FullNameLength, PhoneNumberRequired, PhoneNumberInvalid,
        PhoneNumberDuplicate, EmailInvalid, EmailTooLong, AddressTooLong
    };
}
