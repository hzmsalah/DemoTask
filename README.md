# Shaghaf Workspace Customer Management

A bilingual customer-management proof of concept for Shaghaf co-working-space reception workflows. The React frontend calls an ASP.NET Core API, and EF Core persists customer records in SQL Server 2025. Arabic (RTL) is the default interface language; English (LTR) is available from the language toggle.

> **Scope:** This project uses mock/demo data and is not an official Shaghaf system or a production-grade customer-management service. It intentionally has no end-to-end authentication and does not integrate with external business APIs. See the full bilingual disclaimer at the end of this document.

## Main features

- Create, view, edit, and delete customer records. Deletion requires confirmation.
- Search by customer name or phone number through the API, with server-side pagination (20 records by default; page size is capped at 100).
- Store phone numbers in canonical E.164 format. Egypt is the default input country, while valid international numbers are supported.
- Validate names, phone numbers, email, and address in the frontend and API. Stable validation codes are returned to clients so the interface can show translated messages rather than raw server prose.
- Provide loading, first-use empty, no-search-results, and recoverable error states. A failed save keeps the form open with its entered values; save is disabled while a request is in progress.
- Store customer data in SQL Server through EF Core migrations. `CreatedAt` is assigned by the server; `LastVisit` is optional and cannot be edited through this API.

## Visual enhancements

- Uses the supplied Shaghaf logo assets and a semantic palette: Shaghaf green `#1E473F`, Deep Yellow `#FECC09`, pale-yellow page background `#FEEC98`, and cream hover surface `#FFF6CC`.
- The initial loading state uses the Shaghaf mark as a slow-rotating indicator beside localized loading text; rotation stops when reduced motion is preferred.
- The desktop table has centered headings and cells, a green header with white text, and semibold phone numbers. Edit and delete use accessible icon-only controls.
- Small screens show one customer card per row, medium screens show two top-aligned cards, and large screens use the full table.
- Cards keep name, phone, and actions visible while additional details are collapsed. Each card has its own disclosure control; a page-level Show all / Hide all control is available on card layouts.
- Buttons use consistent Shaghaf yellow or cream hover states. Clear, edit, and delete icons have concise tooltips on desktop pointer/keyboard focus; touch layouts do not depend on tooltips.
- A bilingual footer contains the project disclaimer and a non-clickable GitHub link placeholder. It will become a real repository link after the repository is created; there is no hosted-demo link yet.

## UX and UI decisions

- **Arabic-first and bidirectional:** Arabic loads by default. The English toggle updates page direction and translated labels without reloading. Search direction follows the query’s first strong character, so English text in the Arabic interface and Arabic text in the English interface align correctly; the clear icon follows the text direction as well.
- **Progressive disclosure:** add/edit forms initially show only the required name and phone fields. Email and address are under “Additional Details” / “تفاصيل إضافية”; the section opens automatically in edit mode when saved optional details already exist.
- **Fast scanning:** responsive cards preserve a compact summary and allow per-customer expansion. The page-level show/hide action helps reveal details across the current card list. Desktop retains a table for dense record scanning.
- **Safe interaction:** icon-only actions retain localized accessible names; dialogs support keyboard operation and focus management. Disabled controls communicate their state, and the save lock prevents duplicate submissions.
- **Motion and navigation:** pagination waits for the reduced-motion-aware scroll to the page top before requesting the next result page, then focuses the customer-records region. A floating Back to top button avoids covering the footer disclaimer and respects reduced-motion preferences.
- **Deliberate scope limit:** sorting and filtering beyond the required API-backed name/phone search are deferred to avoid adding controls and query behavior without a demonstrated workflow need.

## Technology and architecture

- **Frontend:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Vitest, and React Testing Library.
- **Backend:** ASP.NET Core on .NET 10, EF Core 10, SQL Server 2025, and xUnit.
- **Phone numbers:** Google libphonenumber metadata on both sides of the API boundary; frontend and backend normalize and validate numbers independently, with the API authoritative.
- **Deployment:** Docker Compose runs SQL Server, the API, and an nginx-served frontend. nginx proxies `/api` to the API service, so the browser uses a same-origin API path in the Docker deployment.
- **Shared test contracts:** `shared/phone-vectors.json` and `shared/validation-codes.json` keep phone-number and validation-code expectations aligned across frontend and backend tests.

```text
backend/WorkspaceApi/        ASP.NET Core API and EF Core migrations
backend/WorkspaceApi.Tests/  xUnit tests, including SQL Server integration tests
frontend/                    React application, translations, and Vitest tests
shared/                      Cross-stack phone and validation test vectors
docker-compose.yml           Local multi-service environment
.env.example                 Safe environment-variable template
```

## Run the full stack with Docker

Requirements: Docker Desktop (or another Docker Engine) with Linux containers enabled. From the repository root, copy the environment template, edit the SQL Server password to a strong local value, then start the services:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env and replace the sample MSSQL_SA_PASSWORD before starting.
docker compose up --build
```

Default endpoints:

| Service | Address |
|---|---|
| Frontend | <http://localhost:3000> |
| API | <http://localhost:5000> |
| SQL Server | `localhost:1433` |

Ports and the database name can be changed in `.env`. The frontend uses nginx to proxy `/api` to the backend container. The SQL Server named volume persists across restarts. Stop the stack with `docker compose down`; **`docker compose down -v` deletes the database volume and its local data.** The `.env` file is ignored by Git and must not contain credentials that are committed or shared.

## Local development

Use Node.js 24 LTS and the .NET 10 SDK. The repository-root `.env` is also read by the Vite configuration for the optional local API proxy target (`VITE_DEV_API_TARGET`, default `http://localhost:5000`).

Start the frontend development server:

```powershell
npm.cmd --prefix frontend install
npm.cmd --prefix frontend run dev
```

The development server is available at <http://localhost:5173> and proxies `/api` to the configured API target.

To run the API directly on the host while keeping SQL Server in Docker, first start the database service:

```powershell
docker compose up -d sqlserver
$env:ConnectionStrings__DefaultConnection = "Server=localhost,1433;Database=ShaghafDb;User Id=sa;Password=REPLACE_WITH_MSSQL_SA_PASSWORD_FROM_DOTENV;TrustServerCertificate=True;"
dotnet run --project backend/WorkspaceApi
```

Replace the connection-string placeholder with the same password configured in `.env`. For the simpler integrated setup, run the complete Compose stack instead.

## API summary

Base path: `/api/customers`. JSON property names use camelCase.

| Method and route | Purpose | Successful response |
|---|---|---|
| `GET /api/customers?search=&page=1&pageSize=20` | List and search by name or phone; all search and paging are executed by the API/SQL Server | `200 OK`, paged result |
| `GET /api/customers/{id}` | Retrieve one customer | `200 OK`; `404 Not Found` if absent |
| `POST /api/customers` | Create a customer | `201 Created` with the created record and location |
| `PUT /api/customers/{id}` | Replace editable customer fields | `204 No Content`; `404 Not Found` if absent |
| `DELETE /api/customers/{id}` | Delete after the UI confirmation step | `204 No Content`; `404 Not Found` if absent |

Create/update request fields are `fullName`, `phoneNumber`, `email`, and `address`. The API trims/collapses name whitespace and canonicalizes phone numbers. Visit dates are not writable request fields.
Field limits: `fullName` is required and 2–150 characters; `phoneNumber` is required and must be valid; `email` is optional, must be valid when supplied, and is limited to 100 characters; `address` is optional and limited to 250 characters.

The paged response includes `items`, `totalCount`, `pageNumber`, `pageSize`, `totalPages`, `hasPreviousPage`, and `hasNextPage`. `pageSize` defaults to 20 and is clamped to 1–100. Results are ordered by `createdAt` descending, with a stable ID tiebreaker.

Validation errors return `400 Bad Request` with an `errors` object keyed by DTO property name (`FullName`, `PhoneNumber`, `Email`, or `Address`); values contain stable codes from [`shared/validation-codes.json`](shared/validation-codes.json). A duplicate phone returns `409 Conflict` with `phoneNumber.duplicate`. Missing records return `404`; malformed JSON returns a safe `400`. API clients should translate known codes and must not display raw server exception text.

## Phone, date, and search behavior

- The phone field defaults to Egypt. A national-format number is interpreted as Egyptian; valid international numbers can be selected or entered with a `+` prefix. Arabic-Indic digits are normalized before the value is submitted.
- The API stores and returns canonical E.164 values. For example, a library-accepted `+2001012345678` is normalized to `+201012345678`.
- Name and phone searching is API-side and debounced in the UI. Arabic name search uses a persisted normalized search key in addition to SQL collation because the measured collation did not equate several common Arabic variants.
- `CreatedAt` is server-generated and displayed as the first-visit date. `LastVisit` is nullable and is not writable through the customer API. A SQL check constraint enforces `LastVisit IS NULL OR LastVisit >= CreatedAt`, preventing a last visit from preceding the first visit. The automatic development seed is mock data only.
- Dates are formatted using the active locale and the browser’s local time zone. Search order is stable across pages; sorting and extra filters are not part of the current MVP.

### Verified Arabic search behavior

These raw results were measured by `CollationBehaviorTests` against the SQL Server 2025 image used by the application. The table records SQL collation behavior on the original name column, independently of application-level normalization.

| Stored | Searched with | Aspect | Result |
|---|---|---|---|
| أحمد | احمد | Alef with hamza above vs bare Alef | Not equal |
| إبراهيم | ابراهيم | Alef with hamza below vs bare Alef | Not equal |
| آدم | ادم | Alef with madda vs bare Alef | Not equal |
| مُحَمَّد | محمد | Tashkeel (diacritics) | Not equal |
| فاطمة | فاطمه | Teh Marbuta vs Heh | Not equal |
| علي | على | Yeh vs Alef Maksura | Not equal |
| محمــد | محمد | Tatweel (kashida) | Equal |
| Ahmed | ahmed | Latin case-insensitivity | Equal |

For Arabic name search, the API normalizes both the query and persisted `FullNameSearch` key. Create/update requests maintain the key, and the initializer backfills existing records after migration. SQL collation continues to provide the verified tatweel and Latin case-insensitive behavior.

## Tests and quality checks

Run from the repository root:

```powershell
dotnet build backend/WorkspaceApi.sln
dotnet test backend/WorkspaceApi.sln
npm.cmd --prefix frontend run typecheck
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
```

Backend integration tests use Testcontainers and require a running Docker daemon; they start SQL Server 2025 for API/database tests. Frontend tests run with Vitest and mock network requests. The typecheck and production build do not require Docker.

## Browser support

The interface targets modern evergreen browsers supported by Tailwind CSS v4. It uses an Arabic-capable system-font fallback and does not depend on external font CDNs.

## Proof-of-concept disclaimer

**English**

> This is a proof-of-concept React & ASP.NET project built around Shaghaf’s business model using mock data. It is not a production-grade customer management system (which would require end-to-end authentication and external API integrations) but rather a demonstration of how I would architect the backend and structure the frontend interface.

**العربية (مصري)**

> ده مشروع تجريبي معمول بـ React و ASP.NET بداتا وهمية ومبني على فكرة وموديل شغل 'شغف'. دي مش صفحة رسمية لإدارة العملاء (لأن ده أكيد هيحتاج نظام تسجيل دخول وتأمين وربط بـ APIs تانية) لكن ده مجرد تطبيق عملي بيوضّح طريقتي في تنظيم الـ Frontend وتقسيم وكتابة الـ Backend.

## Repository link

The application footer currently shows a non-clickable “Link coming soon” GitHub placeholder. Replace it with the actual repository URL after the repository is created. There is no hosted demo link until a deployment is intentionally set up.
