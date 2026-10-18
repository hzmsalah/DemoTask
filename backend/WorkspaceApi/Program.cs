using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkspaceApi.Data;
using WorkspaceApi.Utilities;

var builder = WebApplication.CreateBuilder(args);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddProblemDetails();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(pair => pair.Value is not null)
            .SelectMany(pair => pair.Value!.Errors
                .Where(error => !string.IsNullOrEmpty(error.ErrorMessage) && ValidationCodes.All.Contains(error.ErrorMessage))
                .Select(error => new { Field = pair.Key, Code = error.ErrorMessage! }))
            .GroupBy(error => error.Field)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Code).Distinct().ToArray());
        var details = new ValidationProblemDetails(errors) { Status = StatusCodes.Status400BadRequest };
        return new BadRequestObjectResult(details) { ContentTypes = { "application/problem+json" } };
    };
});
builder.Services.AddOpenApi();
builder.Services.AddCors(options => options.AddPolicy("AllowShaghafClients", policy => policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

var app = builder.Build();
app.UseExceptionHandler();
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        return Task.CompletedTask;
    });
    await next();
});
app.UseCors("AllowShaghafClients");
if (app.Environment.IsDevelopment()) app.MapOpenApi("/openapi/v1.json");
app.MapControllers();

await DbInitializer.InitializeAsync(app.Services, app.Environment);
await app.RunAsync();

public partial class Program { }
