using PhoneNumbers;

namespace WorkspaceApi.Utilities;

public static class PhoneNumberSanitizer
{
    public const string DefaultRegion = "EG";
    private static readonly PhoneNumberUtil Util = PhoneNumberUtil.GetInstance();

    public static string ToWesternDigits(string input)
    {
        if (input is null) return string.Empty;
        return string.Create(input.Length, input, static (destination, source) =>
        {
            for (var i = 0; i < source.Length; i++)
            {
                var c = source[i];
                destination[i] = c switch
                {
                    >= '\u0660' and <= '\u0669' => (char)('0' + c - '\u0660'),
                    >= '\u06F0' and <= '\u06F9' => (char)('0' + c - '\u06F0'),
                    _ => c
                };
            }
        });
    }

    public static bool TryNormalize(string? input, out string e164)
    {
        e164 = string.Empty;
        if (string.IsNullOrWhiteSpace(input)) return false;
        var value = ToWesternDigits(input).Trim();
        try
        {
            var number = Util.Parse(value, DefaultRegion);
            if (number.HasExtension || !Util.IsValidNumber(number)) return false;
            e164 = Util.Format(number, PhoneNumberFormat.E164);
            return true;
        }
        catch (NumberParseException)
        {
            return false;
        }
    }

    public static string NormalizeForSearch(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var value = ToWesternDigits(input.Trim());
        value = value.Replace(" ", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("(", string.Empty, StringComparison.Ordinal)
            .Replace(")", string.Empty, StringComparison.Ordinal)
            .Replace(".", string.Empty, StringComparison.Ordinal);
        if (value.StartsWith('+'))
            return value.Length > 1 && value[1..].All(char.IsAsciiDigit) ? value : string.Empty;
        if (value.StartsWith("00", StringComparison.Ordinal))
        {
            var digits = value[2..];
            return digits.Length > 0 && digits.All(char.IsAsciiDigit) ? "+" + digits : string.Empty;
        }
        if (!value.All(char.IsAsciiDigit)) return string.Empty;
        var fragment = value.TrimStart('0');
        return fragment;
    }
}
