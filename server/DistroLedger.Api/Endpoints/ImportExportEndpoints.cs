using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using DistroLedger.Api.Services;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class ImportExportEndpoints
{
    private static readonly string[] DateFormats =
        { "d-MMM-yyyy", "dd-MMM-yyyy", "d-MMM-yy", "yyyy-MM-dd", "d/M/yyyy", "M/d/yyyy", "dd/MM/yyyy" };

    public static void MapImportExportEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- Import sales from a CSV shaped like the source monthly sheets ----
        app.MapPost("/api/import/sales", async (
            IFormFile file, AppDbContext db, InvoiceNumberService invoices, CancellationToken ct) =>
        {
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { message = "No file uploaded." });

            var tenantId = db.CurrentTenantId;
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            if (tenant is null) return Results.Unauthorized();

            // Existing customers by normalized name for de-dupe.
            var customers = await db.Customers.ToListAsync(ct);
            var byName = customers.ToDictionary(c => Norm(c.Name), c => c);

            int imported = 0, skipped = 0;
            var errors = new List<string>();

            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                BadDataFound = null,
                TrimOptions = TrimOptions.Trim
            });

            await csv.ReadAsync();
            csv.ReadHeader();

            var row = 1;
            while (await csv.ReadAsync())
            {
                row++;
                var name = Field(csv, "Customer Name", "Customer", "Name");
                var amountRaw = Field(csv, "Amount (PKR)", "Amount", "Total");
                if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(amountRaw))
                {
                    skipped++;
                    continue; // blank row
                }

                if (string.IsNullOrWhiteSpace(name))
                {
                    errors.Add($"Row {row}: missing customer name.");
                    skipped++;
                    continue;
                }

                if (!TryParseAmount(amountRaw, out var amount) || amount <= 0)
                {
                    errors.Add($"Row {row}: invalid amount '{amountRaw}'.");
                    skipped++;
                    continue;
                }

                var date = ParseDate(Field(csv, "Date")) ?? DateTime.UtcNow.Date;
                date = DateTime.SpecifyKind(date, DateTimeKind.Utc);

                var key = Norm(name);
                if (!byName.TryGetValue(key, out var customer))
                {
                    customer = new Customer
                    {
                        TenantId = tenantId,
                        Name = name.Trim(),
                        TaxId = Field(csv, "NTN #", "NTN", "Tax ID", "TaxId")
                    };
                    db.Customers.Add(customer);
                    byName[key] = customer;
                }

                var status = ParseStatus(Field(csv, "Payment Status", "Status"));
                var amountPaid = status == PaymentStatus.Paid ? amount : 0m;

                var sale = new Sale
                {
                    TenantId = tenantId,
                    InvoiceNumber = await invoices.NextAsync(tenantId, tenant.InvoicePrefix, date.Year, ct),
                    Date = date,
                    Customer = customer,
                    Amount = amount,
                    AmountPaid = amountPaid,
                    PaymentStatus = status,
                    PaymentMethod = ParseMethod(Field(csv, "Payment Method", "Method")),
                    Notes = Field(csv, "Notes")
                };
                db.Sales.Add(sale);
                imported++;
            }

            await db.SaveChangesAsync(ct);
            return Results.Ok(new ImportResult(imported, skipped, errors));
        })
        .DisableAntiforgery()
        .RequireAuthorization();

        // ---- Export sales as CSV ----
        app.MapGet("/api/export/sales.csv", async (AppDbContext db, int? year, CancellationToken ct) =>
        {
            var query = db.Sales.Include(s => s.Customer).AsQueryable();
            if (year is not null) query = query.Where(s => s.Date.Year == year);
            var sales = await query.OrderBy(s => s.Date).ToListAsync(ct);

            var sb = new StringBuilder();
            sb.AppendLine("Date,Invoice #,Customer Name,Tax ID,Amount,Amount Paid,Outstanding,Payment Status,Payment Method,Notes");
            foreach (var s in sales)
            {
                sb.AppendLine(string.Join(",", new[]
                {
                    s.Date.ToString("yyyy-MM-dd"),
                    Csv(s.InvoiceNumber),
                    Csv(s.Customer?.Name),
                    Csv(s.Customer?.TaxId),
                    s.Amount.ToString(CultureInfo.InvariantCulture),
                    s.AmountPaid.ToString(CultureInfo.InvariantCulture),
                    (s.Amount - s.AmountPaid).ToString(CultureInfo.InvariantCulture),
                    s.PaymentStatus.ToString(),
                    s.PaymentMethod?.ToString() ?? "",
                    Csv(s.Notes)
                }));
            }
            return Results.File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "sales.csv");
        }).RequireAuthorization();

        // ---- Export customers as CSV ----
        app.MapGet("/api/export/customers.csv", async (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await db.Customers
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Name, c.TaxId, c.OtherIds, c.Phone, c.Address, c.City,
                    Total = c.Sales.Sum(s => (decimal?)s.Amount) ?? 0m
                })
                .ToListAsync(ct);

            var sb = new StringBuilder();
            sb.AppendLine("Customer Name,Tax ID,Other IDs,Phone,Address,City,Total Sales");
            foreach (var c in rows)
            {
                sb.AppendLine(string.Join(",", new[]
                {
                    Csv(c.Name), Csv(c.TaxId), Csv(c.OtherIds), Csv(c.Phone),
                    Csv(c.Address), Csv(c.City), c.Total.ToString(CultureInfo.InvariantCulture)
                }));
            }
            return Results.File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "customers.csv");
        }).RequireAuthorization();
    }

    // ---- helpers ----
    private static string? Field(CsvReader csv, params string[] names)
    {
        foreach (var n in names)
            if (csv.TryGetField<string>(n, out var v) && !string.IsNullOrWhiteSpace(v))
                return v.Trim();
        return null;
    }

    private static string Norm(string s) => s.Trim().ToLowerInvariant();

    private static bool TryParseAmount(string? raw, out decimal amount)
    {
        amount = 0;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var cleaned = raw.Replace(",", "").Replace(" ", "").Replace("Rs", "").Replace("$", "");
        return decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out amount);
    }

    private static DateTime? ParseDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        if (DateTime.TryParseExact(raw, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            return d.Date;
        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            return d.Date;
        return null;
    }

    private static PaymentStatus ParseStatus(string? raw) => raw?.Trim().ToLowerInvariant() switch
    {
        "paid" => PaymentStatus.Paid,
        "partial" => PaymentStatus.Partial,
        _ => PaymentStatus.Unpaid
    };

    private static PaymentMethod? ParseMethod(string? raw) => raw?.Trim().ToLowerInvariant() switch
    {
        "cash" => PaymentMethod.Cash,
        "bank" => PaymentMethod.Bank,
        "cheque" or "check" => PaymentMethod.Cheque,
        "credit" => PaymentMethod.Credit,
        null or "" => null,
        _ => PaymentMethod.Other
    };

    private static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        return value;
    }
}
