using Testcontainers.MsSql;

namespace WorkspaceApi.Tests;

public sealed class SqlServerFixture : IAsyncLifetime
{
    private readonly MsSqlContainer container = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2025-latest")
        .Build();
    private string? previousConnectionString;

    public string ConnectionString => container.GetConnectionString();
    public async Task InitializeAsync()
    {
        previousConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        await container.StartAsync();
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", ConnectionString);
    }

    public async Task DisposeAsync()
    {
        try
        {
            await container.DisposeAsync();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", previousConnectionString);
        }
    }
}

[CollectionDefinition("sqlserver")]
public sealed class SqlServerCollection : ICollectionFixture<SqlServerFixture>;
