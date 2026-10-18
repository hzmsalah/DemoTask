using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WorkspaceApi.Data;

#nullable disable

namespace WorkspaceApi.Data.Migrations;

[DbContext(typeof(AppDbContext))]
partial class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "10.0.13");
        modelBuilder.Entity("WorkspaceApi.Models.Customer", b =>
        {
            b.Property<Guid>("Id").ValueGeneratedNever().HasColumnType("uniqueidentifier");
            b.Property<string>("Address").HasMaxLength(250).HasColumnType("nvarchar(250)");
            b.Property<DateTimeOffset>("CreatedAt").HasColumnType("datetimeoffset");
            b.Property<string>("Email").HasMaxLength(100).HasColumnType("nvarchar(100)");
            b.Property<string>("FullName").IsRequired().HasMaxLength(150).UseCollation("Arabic_100_CI_AI").HasColumnType("nvarchar(150)");
            b.Property<string>("FullNameSearch").HasMaxLength(150).UseCollation("Arabic_100_CI_AI").HasColumnType("nvarchar(150)");
            b.Property<DateTimeOffset?>("LastVisit").HasColumnType("datetimeoffset");
            b.Property<string>("PhoneNumber").IsRequired().HasMaxLength(20).HasColumnType("nvarchar(20)");
            b.HasKey("Id");
            b.HasIndex("CreatedAt");
            b.HasIndex("PhoneNumber").IsUnique();
            b.ToTable("Customers", t => t.HasCheckConstraint("CK_Customers_LastVisit_NotBeforeCreatedAt", "[LastVisit] IS NULL OR [LastVisit] >= [CreatedAt]"));
        });
#pragma warning restore 612, 618
    }
}
