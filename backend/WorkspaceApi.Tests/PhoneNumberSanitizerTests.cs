using System.Text.Json;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Tests;

public sealed class PhoneNumberSanitizerTests
{
    private sealed record Valid(string Input, string E164);
    private sealed record Invalid(string? Input);
    private sealed record Search(string Input, string Fragment);
    private sealed record Vectors(List<Valid> Valid, List<Invalid> Invalid, List<Search> Search);

    private static Vectors Load()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "shared", "phone-vectors.json"))) root = root.Parent;
        Assert.NotNull(root);
        return JsonSerializer.Deserialize<Vectors>(File.ReadAllText(Path.Combine(root!.FullName, "shared", "phone-vectors.json")), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    public static IEnumerable<object[]> ValidCases() => Load().Valid.Select(x => new object[] { x.Input, x.E164 });
    public static IEnumerable<object[]> InvalidCases() => Load().Invalid.Select(x => new object[] { x.Input! });
    public static IEnumerable<object[]> SearchCases() => Load().Search.Select(x => new object[] { x.Input, x.Fragment });

    [Theory]
    [MemberData(nameof(ValidCases))]
    public void Valid_vectors_normalize(string input, string expected)
    {
        Assert.True(PhoneNumberSanitizer.TryNormalize(input, out var actual));
        Assert.Equal(expected, actual);
    }

    [Theory]
    [MemberData(nameof(InvalidCases))]
    public void Invalid_vectors_are_rejected(string? input) => Assert.False(PhoneNumberSanitizer.TryNormalize(input, out _));

    [Theory]
    [MemberData(nameof(SearchCases))]
    public void Search_vectors_normalize_leniently(string input, string expected) => Assert.Equal(expected, PhoneNumberSanitizer.NormalizeForSearch(input));
}
