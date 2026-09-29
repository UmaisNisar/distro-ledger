namespace DistroLedger.Domain;

/// <summary>
/// Per-tenant, per-year invoice sequence. Incremented atomically when a sale is
/// created so invoice numbers are gapless and unique within a company + year.
/// </summary>
public class InvoiceCounter
{
    public Guid TenantId { get; set; }
    public int Year { get; set; }
    public int LastNumber { get; set; }
}
