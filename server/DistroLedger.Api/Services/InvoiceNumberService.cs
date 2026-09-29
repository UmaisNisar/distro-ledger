using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Services;

/// <summary>
/// Generates gapless, unique invoice numbers per tenant + year, e.g. "INV-2026-0001".
/// The (TenantId, InvoiceNumber) unique index is the final safety net against races.
/// </summary>
public class InvoiceNumberService
{
    private readonly AppDbContext _db;

    public InvoiceNumberService(AppDbContext db) => _db = db;

    /// <summary>
    /// Reserves the next number for the given tenant/year and returns the formatted string.
    /// The caller saves within the same transaction as the sale insert.
    /// </summary>
    public async Task<string> NextAsync(Guid tenantId, string prefix, int year, CancellationToken ct)
    {
        // Check the change tracker first: during a batch import many rows share one
        // context and SaveChanges runs once at the end, so a just-created counter is
        // not yet queryable from the store. Local avoids creating duplicate counters.
        var counter = _db.InvoiceCounters.Local
                          .FirstOrDefault(c => c.TenantId == tenantId && c.Year == year)
                      ?? await _db.InvoiceCounters
                          .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Year == year, ct);

        if (counter is null)
        {
            counter = new InvoiceCounter { TenantId = tenantId, Year = year, LastNumber = 0 };
            _db.InvoiceCounters.Add(counter);
        }

        counter.LastNumber++;
        return $"{prefix}-{year}-{counter.LastNumber:0000}";
    }
}
