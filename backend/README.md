# Workspace API

ASP.NET Core 10 Web API for Shaghaf customer management. The API uses SQL Server 2025 and EF Core 10 migrations. Request DTOs accept only editable customer fields; phones are validated with libphonenumber-csharp and persisted as E.164.

## Run

From the repository root, provide `ConnectionStrings__DefaultConnection` (or use the repository Docker Compose stack) and run:

```powershell
.work\tools\dotnet\dotnet.exe run --project backend\WorkspaceApi
```

Development runs migrations and seeds 25 customers only when the table is empty. Testing and Production never seed. OpenAPI is development-only at `/openapi/v1.json`.

## Test

```powershell
.work\tools\dotnet\dotnet.exe test backend\WorkspaceApi.sln
```

Integration tests use Testcontainers against `mcr.microsoft.com/mssql/server:2025-latest`; Docker Desktop must be available. The API emits validation codes, not user-facing prose. Frontend translations own presentation of those codes.

## Verified Arabic collation

The integration gate records behavior on the same SQL Server image used by the application. The `FullName` column uses `Arabic_100_CI_AI`; run `CollationBehaviorTests` against SQL Server to populate the observed Equal/Not equal results before relying on a variant.

| Stored | Searched with | Observed |
|---|---|---|
| أحمد | احمد | Unverified (restore blocked before container startup) |
| إبراهيم | ابراهيم | Unverified (restore blocked before container startup) |
| آدم | ادم | Unverified (restore blocked before container startup) |
| مُحَمَّد | محمد | Unverified (restore blocked before container startup) |
| فاطمة | فاطمه | Unverified (restore blocked before container startup) |
| علي | على | Unverified (restore blocked before container startup) |
| محمــد | محمد | Unverified (restore blocked before container startup) |
| Ahmed | ahmed | Unverified (restore blocked before container startup) |
