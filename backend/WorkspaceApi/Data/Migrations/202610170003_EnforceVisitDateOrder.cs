using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WorkspaceApi.Data;

#nullable disable

namespace WorkspaceApi.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("202610170003_EnforceVisitDateOrder")]
public partial class EnforceVisitDateOrder : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE [Customers] SET [LastVisit] = NULL WHERE [LastVisit] < [CreatedAt];");
        migrationBuilder.AddCheckConstraint(
            name: "CK_Customers_LastVisit_NotBeforeCreatedAt",
            table: "Customers",
            sql: "[LastVisit] IS NULL OR [LastVisit] >= [CreatedAt]");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(
            name: "CK_Customers_LastVisit_NotBeforeCreatedAt",
            table: "Customers");
    }
}
