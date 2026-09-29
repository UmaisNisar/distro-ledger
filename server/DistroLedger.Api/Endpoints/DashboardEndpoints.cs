using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard").RequireAuthorization();

        // Monthly totals + transaction counts for a year (mirrors the "Summary" sheet).
        group.MapGet("/summary", async (int? year, AppDbContext db, CancellationToken ct) =>
        {
            var y = year ?? DateTime.UtcNow.Year;
            var months = await MonthlyTotals(db, y, ct);
            return Results.Ok(new MonthlySummaryDto(
                y, months, months.Sum(m => m.Total), months.Sum(m => m.Transactions)));
        });

        // KPI cards + trend for the current year.
        group.MapGet("/overview", async (AppDbContext db, CancellationToken ct) =>
        {
            var now = DateTime.UtcNow;
            var trend = await MonthlyTotals(db, now.Year, ct);

            var monthSales = trend.FirstOrDefault(m => m.Month == now.Month)?.Total ?? 0m;
            var monthTx = trend.FirstOrDefault(m => m.Month == now.Month)?.Transactions ?? 0;
            var yearSales = trend.Sum(m => m.Total);
            var outstanding = await db.Sales.SumAsync(s => (decimal?)(s.Amount - s.AmountPaid), ct) ?? 0m;
            var customerCount = await db.Customers.CountAsync(ct);

            return Results.Ok(new OverviewDto(
                monthSales, monthTx, yearSales, outstanding, customerCount, trend));
        });
    }

    private static async Task<List<MonthTotal>> MonthlyTotals(AppDbContext db, int year, CancellationToken ct)
    {
        var rows = await db.Sales
            .Where(s => s.Date.Year == year)
            .GroupBy(s => s.Date.Month)
            .Select(g => new { Month = g.Key, Total = g.Sum(s => s.Amount), Count = g.Count() })
            .ToListAsync(ct);

        return Enumerable.Range(1, 12).Select(m =>
        {
            var r = rows.FirstOrDefault(x => x.Month == m);
            return new MonthTotal(m, CustomerEndpoints.MonthName(m), r?.Total ?? 0m, r?.Count ?? 0);
        }).ToList();
    }
}
