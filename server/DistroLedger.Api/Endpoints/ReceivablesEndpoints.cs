using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class ReceivablesEndpoints
{
    public static void MapReceivablesEndpoints(this IEndpointRouteBuilder app)
    {
        // Outstanding balances grouped by customer, with simple aging by invoice date.
        app.MapGet("/api/receivables", async (AppDbContext db, CancellationToken ct) =>
        {
            var today = DateTime.UtcNow.Date;

            // Pull open sales (something still owed) into memory for aging math.
            var open = await db.Sales
                .Where(s => s.Amount - s.AmountPaid > 0)
                .Include(s => s.Customer)
                .Select(s => new
                {
                    s.CustomerId,
                    CustomerName = s.Customer!.Name,
                    s.Date,
                    Outstanding = s.Amount - s.AmountPaid
                })
                .ToListAsync(ct);

            var customers = open
                .GroupBy(s => new { s.CustomerId, s.CustomerName })
                .Select(g =>
                {
                    decimal current = 0, d31 = 0, d61 = 0, d90 = 0;
                    foreach (var s in g)
                    {
                        var age = (today - s.Date.Date).Days;
                        if (age <= 30) current += s.Outstanding;
                        else if (age <= 60) d31 += s.Outstanding;
                        else if (age <= 90) d61 += s.Outstanding;
                        else d90 += s.Outstanding;
                    }
                    return new ReceivableCustomer(
                        g.Key.CustomerId, g.Key.CustomerName,
                        g.Sum(x => x.Outstanding), g.Count(), g.Min(x => x.Date),
                        current, d31, d61, d90);
                })
                .OrderByDescending(c => c.Outstanding)
                .ToList();

            return Results.Ok(new ReceivablesDto(customers.Sum(c => c.Outstanding), customers));
        }).RequireAuthorization();
    }
}
