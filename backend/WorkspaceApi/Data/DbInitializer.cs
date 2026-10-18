using Microsoft.EntityFrameworkCore;
using WorkspaceApi.Models;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IWebHostEnvironment environment, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync(ct);
        var customersMissingSearchKey = await db.Customers.Where(customer => customer.FullNameSearch == null).ToListAsync(ct);
        foreach (var customer in customersMissingSearchKey)
            customer.FullNameSearch = ArabicTextNormalizer.Normalize(customer.FullName);
        if (customersMissingSearchKey.Count > 0) await db.SaveChangesAsync(ct);
        if (!environment.IsDevelopment() || await db.Customers.AnyAsync(ct)) return;

        var seed = new (string Name, string Phone, string? Email, string? Address, DateTimeOffset? LastVisit)[]
        {
            ("أحمد محمد", "01012345678", "ahmed@example.com", "القاهرة", DateTimeOffset.UtcNow.AddDays(-2)),
            ("سارة علي", "01098765432", "sara@example.com", "الجيزة", null),
            ("محمود حسن", "01112345678", null, "مدينة نصر", DateTimeOffset.UtcNow.AddDays(-5)),
            ("نور خالد", "01212345678", null, null, null),
            ("عمر إبراهيم", "01512345678", "omar@example.com", "المعادي", null),
            ("فاطمة يوسف", "+966501234567", null, "Riyadh", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Ahmed Hassan", "+8613812345678", "ahmed.h@example.com", "Shanghai", null),
            ("Emma Smith", "+447911123456", null, "London", null),
            ("Lina Chen", "+971501234567", "lina@example.com", "Dubai", null),
            ("يوسف سامي", "01022223333", null, null, null),
            ("ريم مصطفى", "01033334444", null, "الإسكندرية", null),
            ("كريم عادل", "01044445555", "karim@example.com", null, null),
            ("هدى طارق", "01055556666", null, null, null),
            ("ياسر نبيل", "01066667777", null, "المنصورة", null),
            ("منى أشرف", "01077778888", null, null, null),
            ("طارق السيد", "01088889999", null, null, null),
            ("جنى وليد", "01099990000", null, null, null),
            ("Michael Brown", "01123456789", "michael@example.com", "Cairo", null),
            ("حسن عبد الله", "01223456789", null, null, null),
            ("ليلى ممدوح", "01523456789", null, null, null),
            ("Sam Wilson", "01011223344", null, null, null),
            ("داليا فؤاد", "01022334455", null, null, null),
            ("باسم حمدي", "01033445566", null, null, null),
            ("Nadia Salem", "01044556677", null, null, null),
            ("إياد رامي", "01055667788", null, null, null)
        };
        foreach (var row in seed)
        {
            if (!PhoneNumberSanitizer.TryNormalize(row.Phone, out var phone)) continue;
            db.Customers.Add(new Customer { FullName = row.Name, FullNameSearch = ArabicTextNormalizer.Normalize(row.Name), PhoneNumber = phone, Email = row.Email, Address = row.Address, CreatedAt = row.LastVisit?.AddDays(-30) ?? DateTimeOffset.UtcNow, LastVisit = row.LastVisit });
        }
        await db.SaveChangesAsync(ct);
    }
}
