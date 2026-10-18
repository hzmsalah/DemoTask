using System.Text;

namespace WorkspaceApi.Utilities;

public static class ArabicTextNormalizer
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        var normalized = new StringBuilder(value.Length);
        foreach (var character in value)
        {
            if (character == '\u0640' || character is >= '\u064B' and <= '\u065F' || character == '\u0670') continue;
            normalized.Append(character switch
            {
                '\u0622' or '\u0623' or '\u0625' => '\u0627',
                '\u0629' => '\u0647',
                '\u0649' => '\u064A',
                _ => character
            });
        }

        return normalized.ToString();
    }
}
