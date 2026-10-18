using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using WorkspaceApi.Data;
using WorkspaceApi.Dtos;
using WorkspaceApi.Models;
using WorkspaceApi.Utilities;

namespace WorkspaceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CustomersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CustomerReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<CustomerReadDto>>> GetCustomers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        page = Math.Clamp(page, 1, 100_000);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Customers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var rawSearchTerm = search.Trim();
            if (rawSearchTerm.Length > 100) rawSearchTerm = rawSearchTerm[..100];
            var nameTerm = ArabicTextNormalizer.Normalize(rawSearchTerm);
            var phoneTerm = PhoneNumberSanitizer.NormalizeForSearch(rawSearchTerm);

            if (nameTerm.Length == 0)
                query = phoneTerm.Length == 0 ? query.Where(_ => false) : query.Where(c => c.PhoneNumber.Contains(phoneTerm));
            else if (phoneTerm.Length == 0)
                query = query.Where(c => c.FullNameSearch != null && c.FullNameSearch.Contains(nameTerm));
            else
                query = query.Where(c => (c.FullNameSearch != null && c.FullNameSearch.Contains(nameTerm)) || c.PhoneNumber.Contains(phoneTerm));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query.OrderByDescending(c => c.CreatedAt).ThenBy(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CustomerReadDto(c.Id, c.FullName, c.PhoneNumber, c.Email, c.Address, c.CreatedAt, c.LastVisit))
            .ToListAsync(ct);
        return Ok(new PagedResult<CustomerReadDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerReadDto>> GetCustomer(Guid id, CancellationToken ct)
    {
        var customer = await db.Customers.AsNoTracking().Where(c => c.Id == id)
            .Select(c => new CustomerReadDto(c.Id, c.FullName, c.PhoneNumber, c.Email, c.Address, c.CreatedAt, c.LastVisit))
            .SingleOrDefaultAsync(ct);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerReadDto>> Create(CustomerCreateDto dto, CancellationToken ct)
    {
        if (!TryNormalizeInput(dto.FullName, dto.PhoneNumber, dto.Email, dto.Address, out var name, out var phone, out var email, out var address))
            return ValidationProblem(ModelState);
        if (await db.Customers.AnyAsync(c => c.PhoneNumber == phone, ct)) return DuplicatePhone();

        var customer = new Customer { FullName = name, FullNameSearch = ArabicTextNormalizer.Normalize(name), PhoneNumber = phone, Email = email, Address = address };
        db.Customers.Add(customer);
        if (!await TrySaveChangesAsync(ct)) return DuplicatePhone();
        var result = ToReadDto(customer);
        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CustomerUpdateDto dto, CancellationToken ct)
    {
        var customer = await db.Customers.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (customer is null) return NotFound();
        if (!TryNormalizeInput(dto.FullName, dto.PhoneNumber, dto.Email, dto.Address, out var name, out var phone, out var email, out var address))
            return ValidationProblem(ModelState);
        if (await db.Customers.AnyAsync(c => c.PhoneNumber == phone && c.Id != id, ct)) return DuplicatePhone();

        customer.FullName = name;
        customer.FullNameSearch = ArabicTextNormalizer.Normalize(name);
        customer.PhoneNumber = phone;
        customer.Email = email;
        customer.Address = address;
        if (!await TrySaveChangesAsync(ct)) return DuplicatePhone();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var customer = await db.Customers.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (customer is null) return NotFound();
        db.Customers.Remove(customer);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<bool> TrySaveChangesAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return false;
        }
    }

    private bool TryNormalizeInput(string? rawName, string? rawPhone, string? rawEmail, string? rawAddress, out string name, out string phone, out string? email, out string? address)
    {
        name = CollapseWhitespace(rawName);
        email = NullIfBlank(rawEmail);
        address = NullIfBlank(rawAddress);
        phone = string.Empty;
        if (name.Length is < 2 or > 150) ModelState.AddModelError(nameof(CustomerCreateDto.FullName), ValidationCodes.FullNameLength);
        if (!PhoneNumberSanitizer.TryNormalize(rawPhone, out phone))
            ModelState.AddModelError(nameof(CustomerCreateDto.PhoneNumber), string.IsNullOrWhiteSpace(rawPhone) ? ValidationCodes.PhoneNumberRequired : ValidationCodes.PhoneNumberInvalid);
        return ModelState.IsValid;
    }

    private static string CollapseWhitespace(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var pieces = value.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', pieces);
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static CustomerReadDto ToReadDto(Customer c) => new(c.Id, c.FullName, c.PhoneNumber, c.Email, c.Address, c.CreatedAt, c.LastVisit);

    private ObjectResult DuplicatePhone()
    {
        var details = new ValidationProblemDetails(new Dictionary<string, string[]> { [nameof(CustomerCreateDto.PhoneNumber)] = [ValidationCodes.PhoneNumberDuplicate] }) { Status = StatusCodes.Status409Conflict };
        return StatusCode(StatusCodes.Status409Conflict, details);
    }

    private static bool IsUniqueViolation(DbUpdateException exception) => exception.InnerException is SqlException { Number: 2601 or 2627 } || exception.InnerException?.InnerException is SqlException { Number: 2601 or 2627 };
}
