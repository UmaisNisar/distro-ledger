using DistroLedger.Api.Services;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class SaleEndpoints
{
    public static void MapSaleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sales").RequireAuthorization();

        // List with filters + paging.
        group.MapGet("", async (
            AppDbContext db, int? year, int? month, Guid? customerId, PaymentStatus? status,
            string? q, int page, int pageSize, CancellationToken ct) =>
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize is <= 0 or > 1000 ? 50 : pageSize;

            var query = db.Sales.Include(s => s.Customer).AsQueryable();
            if (year is not null) query = query.Where(s => s.Date.Year == year);
            if (month is not null) query = query.Where(s => s.Date.Month == month);
            if (customerId is not null) query = query.Where(s => s.CustomerId == customerId);
            if (status is not null) query = query.Where(s => s.PaymentStatus == status);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(s => s.InvoiceNumber.ToLower().Contains(term)
                                         || s.Customer!.Name.ToLower().Contains(term));
            }

            var total = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(s => s.Date).ThenByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(s => s.ToDto(s.Customer!.Name))
                .ToListAsync(ct);

            return Results.Ok(new PagedResult<SaleDto>(items, total, page, pageSize));
        });

        // Single
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var sale = await db.Sales.Include(s => s.Customer)
                .Where(s => s.Id == id)
                .Select(s => s.ToDto(s.Customer!.Name))
                .FirstOrDefaultAsync(ct);
            return sale is null ? Results.NotFound() : Results.Ok(sale);
        });

        // Create (auto invoice number, derived payment status)
        group.MapPost("", async (
            SaleRequest req, AppDbContext db, InvoiceNumberService invoices, CancellationToken ct) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == db.CurrentTenantId, ct);
            if (tenant is null) return Results.Unauthorized();

            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == req.CustomerId, ct);
            if (customer is null) return Results.BadRequest(new { message = "Unknown customer." });

            var date = DateTime.SpecifyKind(req.Date.Date, DateTimeKind.Utc);
            var invoiceNumber = await invoices.NextAsync(tenant.Id, tenant.InvoicePrefix, date.Year, ct);

            var sale = new Sale
            {
                TenantId = tenant.Id,
                InvoiceNumber = invoiceNumber,
                Date = date,
                CustomerId = customer.Id,
                Amount = req.Amount,
                AmountPaid = req.AmountPaid,
                PaymentStatus = DeriveStatus(req.Amount, req.AmountPaid),
                PaymentMethod = req.PaymentMethod,
                Notes = req.Notes
            };
            db.Sales.Add(sale);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/sales/{sale.Id}", sale.ToDto(customer.Name));
        }).ValidateBody<SaleRequest>();

        // Update (invoice number is immutable)
        group.MapPut("/{id:guid}", async (Guid id, SaleRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var sale = await db.Sales.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (sale is null) return Results.NotFound();

            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == req.CustomerId, ct);
            if (customer is null) return Results.BadRequest(new { message = "Unknown customer." });

            sale.Date = DateTime.SpecifyKind(req.Date.Date, DateTimeKind.Utc);
            sale.CustomerId = req.CustomerId;
            sale.Amount = req.Amount;
            sale.AmountPaid = req.AmountPaid;
            sale.PaymentStatus = DeriveStatus(req.Amount, req.AmountPaid);
            sale.PaymentMethod = req.PaymentMethod;
            sale.Notes = req.Notes;
            await db.SaveChangesAsync(ct);

            return Results.Ok(sale.ToDto(customer.Name));
        }).ValidateBody<SaleRequest>();

        // Delete
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var sale = await db.Sales.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (sale is null) return Results.NotFound();
            db.Sales.Remove(sale);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // Printable invoice payload (company + customer + sale)
        group.MapGet("/{id:guid}/invoice", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var sale = await db.Sales.Include(s => s.Customer).FirstOrDefaultAsync(s => s.Id == id, ct);
            if (sale is null || sale.Customer is null) return Results.NotFound();
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == db.CurrentTenantId, ct);
            if (tenant is null) return Results.NotFound();

            var custTotal = await db.Sales.Where(s => s.CustomerId == sale.CustomerId)
                .SumAsync(s => (decimal?)s.Amount, ct) ?? 0m;

            return Results.Ok(new InvoiceDto(
                tenant.ToDto(), sale.Customer.ToDto(custTotal), sale.ToDto(sale.Customer.Name)));
        });
    }

    private static PaymentStatus DeriveStatus(decimal amount, decimal paid) =>
        paid <= 0 ? PaymentStatus.Unpaid
        : paid >= amount ? PaymentStatus.Paid
        : PaymentStatus.Partial;
}
