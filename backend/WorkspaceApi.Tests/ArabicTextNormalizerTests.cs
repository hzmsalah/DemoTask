using WorkspaceApi.Utilities;

namespace WorkspaceApi.Tests;

public sealed class ArabicTextNormalizerTests
{
    [Theory]
    [InlineData("أحمد", "احمد")]
    [InlineData("إبراهيم", "ابراهيم")]
    [InlineData("آدم", "ادم")]
    [InlineData("مُحَمَّد", "محمد")]
    [InlineData("فاطمة", "فاطمه")]
    [InlineData("على", "علي")]
    [InlineData("علي", "علي")]
    [InlineData("محمــد", "محمد")]
    [InlineData("Ahmed", "Ahmed")]
    public void Normalize_applies_verified_search_mappings(string value, string expected)
    {
        Assert.Equal(expected, ArabicTextNormalizer.Normalize(value));
    }

    [Fact]
    public void Normalize_handles_empty_input()
    {
        Assert.Equal(string.Empty, ArabicTextNormalizer.Normalize(string.Empty));
        Assert.Equal(string.Empty, ArabicTextNormalizer.Normalize(null));
    }
}
