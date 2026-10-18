using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace WorkspaceApi.Tests;

public sealed class CustomersApiFactory(SqlServerFixture fixture) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = fixture.ConnectionString,
            ["Cors:AllowedOrigins:0"] = "http://localhost:3000",
            ["Cors:AllowedOrigins:1"] = "http://localhost:5173"
        }));
    }
}
