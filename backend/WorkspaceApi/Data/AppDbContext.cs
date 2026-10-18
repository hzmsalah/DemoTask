using Microsoft.EntityFrameworkCore;
using WorkspaceApi.Models;

namespace WorkspaceApi.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_Customers_LastVisit_NotBeforeCreatedAt",
                "[LastVisit] IS NULL OR [LastVisit] >= [CreatedAt]"));
            entity.Property(c => c.FullName).UseCollation("Arabic_100_CI_AI").IsRequired().HasMaxLength(150);
            entity.Property(c => c.FullNameSearch).UseCollation("Arabic_100_CI_AI").HasMaxLength(150);
            entity.Property(c => c.PhoneNumber).IsRequired().HasMaxLength(20);
            entity.Property(c => c.Email).HasMaxLength(100);
            entity.Property(c => c.Address).HasMaxLength(250);
            entity.HasIndex(c => c.PhoneNumber).IsUnique();
            entity.HasIndex(c => c.CreatedAt);
        });
    }
}
