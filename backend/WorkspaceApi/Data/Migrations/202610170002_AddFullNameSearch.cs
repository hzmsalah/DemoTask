using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WorkspaceApi.Data;

#nullable disable

namespace WorkspaceApi.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("202610170002_AddFullNameSearch")]
public partial class AddFullNameSearch : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "FullNameSearch",
            table: "Customers",
            type: "nvarchar(150)",
            maxLength: 150,
            nullable: true,
            collation: "Arabic_100_CI_AI");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "FullNameSearch", table: "Customers");
    }
}
