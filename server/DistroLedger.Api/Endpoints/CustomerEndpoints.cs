using System.Globalization;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class CustomerEndpoints
{
    public static void MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/customers").RequireAuthorization();

        // List (optionally search by name / tax id), with computed YTD-style total sales.
        group.MapGet("", async (AppDbContext db, string? q, CancellationToken ct) =>
        {
            var query = db.Customers.AsQueryable();
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term)
                                         || (c.TaxId != null && c.TaxId.ToLower().Contains(term)));
            }

            var items = await query
                .OrderBy(c => c.Name)
                .Select(c => new CustomerDto(
                    c.Id, c.Name, c.TaxId, c.OtherIds, c.Phone, c.Address, c.City,
                    c.Sales.Sum(s => (decimal?)s.Amount) ?? 0m, c.CreatedAt))
                .ToListAsync(ct);

            return Results.Ok(items);
        });

        // Single
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var c = await db.Customers
                .Where(x => x.Id == id)
                .Select(x => new CustomerDto(
                    x.Id, x.Name, x.TaxId, x.OtherIds, x.Phone, x.Address, x.City,
                    x.Sales.Sum(s => (decimal?)s.Amount) ?? 0m, x.CreatedAt))
                .FirstOrDefaultAsync(ct);
            return c is null ? Results.NotFound() : Results.Ok(c);
        });

        // Create
        group.MapPost("", async (CustomerRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var customer = new Customer
            {
                TenantId = db.CurrentTenantId,
                Name = req.Name.Trim(),
                TaxId = req.TaxId,
                OtherIds = req.OtherIds,
                Phone = req.Phone,
                Address = req.Address,
                City = req.City
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/customers/{customer.Id}", customer.ToDto(0m));
        }).ValidateBody<CustomerRequest>();

        // Update
        group.MapPut("/{id:guid}", async (Guid id, CustomerRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (customer is null) return Results.NotFound();

            customer.Name = req.Name.Trim();
            customer.TaxId = req.TaxId;
            customer.OtherIds = req.OtherIds;
            customer.Phone = req.Phone;
            customer.Address = req.Address;
            customer.City = req.City;
            await db.SaveChangesAsync(ct);

            var total = await db.Sales.Where(s => s.CustomerId == id).SumAsync(s => (decimal?)s.Amount, ct) ?? 0m;
            return Results.Ok(customer.ToDto(total));
        }).ValidateBody<CustomerRequest>();

        // Delete (blocked if the customer has sales)
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (customer is null) return Results.NotFound();

            var hasSales = await db.Sales.AnyAsync(s => s.CustomerId == id, ct);
            if (hasSales)
                return Results.Conflict(new { message = "This customer has sales and cannot be deleted." });

            db.Customers.Remove(customer);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // Per-customer full-year monthly breakdown (mirrors the sheet's Lookup tab).
        group.MapGet("/{id:guid}/summary", async (Guid id, int? year, AppDbContext db, CancellationToken ct) =>
        {
            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (customer is null) return Results.NotFound();

            var y = year ?? DateTime.UtcNow.Year;
            var rows = await db.Sales
                .Where(s => s.CustomerId == id && s.Date.Year == y)
                .GroupBy(s => s.Date.Month)
                .Select(g => new { Month = g.Key, Sales = g.Sum(s => s.Amount), Count = g.Count() })
                .ToListAsync(ct);

            var months = Enumerable.Range(1, 12).Select(m =>
            {
                var r = rows.FirstOrDefault(x => x.Month == m);
                return new MonthBreakdown(m, MonthName(m), r?.Sales ?? 0m, r?.Count ?? 0);
            }).ToList();

            var dto = new CustomerSummaryDto(
                customer.Id, customer.Name, y,
                months.Sum(m => m.Sales), months.Sum(m => m.Transactions), months);
            return Results.Ok(dto);
        });
    }

    internal static string MonthName(int m) =>
        CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(m);
}
