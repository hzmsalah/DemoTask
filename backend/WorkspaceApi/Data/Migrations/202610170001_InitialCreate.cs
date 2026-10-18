using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WorkspaceApi.Data;

#nullable disable

namespace WorkspaceApi.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("202610170001_InitialCreate")]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Customers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false, collation: "Arabic_100_CI_AI"),
                PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                Address = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                LastVisit = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_Customers", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_Customers_CreatedAt", table: "Customers", column: "CreatedAt");
        migrationBuilder.CreateIndex(name: "IX_Customers_PhoneNumber", table: "Customers", column: "PhoneNumber", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "Customers");
}
