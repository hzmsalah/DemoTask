using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkspaceApi.Data;
using WorkspaceApi.Models;
using WorkspaceApi.Utilities;
using Xunit.Abstractions;

namespace WorkspaceApi.Tests;

[Collection("sqlserver")]
public sealed class CollationBehaviorTests(SqlServerFixture fixture, ITestOutputHelper output) : IAsyncLifetime
{
    private readonly CustomersApiFactory factory = new(fixture);
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Customers.ExecuteDeleteAsync();
    }

    public Task DisposeAsync()
    {
        client.Dispose();
        factory.Dispose();
        return Task.CompletedTask;
    }

    [Theory]
    [InlineData("أحمد", "احمد", "Alef with hamza above vs bare Alef")]
    [InlineData("إبراهيم", "ابراهيم", "Alef with hamza below vs bare Alef")]
    [InlineData("آدم", "ادم", "Alef with madda vs bare Alef")]
    [InlineData("مُحَمَّد", "محمد", "Tashkeel")]
    [InlineData("فاطمة", "فاطمه", "Teh Marbuta vs Heh")]
    [InlineData("علي", "على", "Yeh vs Alef Maksura")]
    [InlineData("محمــد", "محمد", "Tatweel")]
    [InlineData("Ahmed", "ahmed", "Latin case-insensitivity")]
    public async Task Records_observed_collation_behavior(string stored, string searched, string aspect)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Customers.Add(new Customer
        {
            FullName = stored,
            FullNameSearch = ArabicTextNormalizer.Normalize(stored),
            PhoneNumber = "+201012345678"
        });
        await db.SaveChangesAsync();

        var matchCount = await db.Customers.CountAsync(customer => customer.FullName.Contains(searched));
        Assert.InRange(matchCount, 0, 1);
        output.WriteLine($"{aspect}\t{stored}\t{searched}\t{(matchCount == 1 ? "Equal" : "Not equal")}");
    }
}
