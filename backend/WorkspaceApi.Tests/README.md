# WorkspaceApi.Tests

The suite contains unit tests driven by the repository-root `shared/phone-vectors.json` and `shared/validation-codes.json`, plus HTTP integration tests against a shared SQL Server 2025 Testcontainers instance. No EF InMemory provider is used. Run from the repository root with:

```powershell
.work\tools\dotnet\dotnet.exe test backend\WorkspaceApi.sln
```

Docker Desktop must be running and accessible to the current account.
