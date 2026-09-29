namespace DistroLedger.Domain;

/// <summary>
/// A single sale / invoice row. Mirrors a row in a monthly sheet, but with the
/// invoice number, payment status and payment method actually enforced.
/// </summary>
public class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    /// <summary>Auto-generated per tenant, e.g. "INV-2026-0001".</summary>
    public string InvoiceNumber { get; set; } = string.Empty;

    /// <summary>Sale date (date-only semantics; stored as UTC midnight).</summary>
    public DateTime Date { get; set; }

    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    /// <summary>Invoice total.</summary>
    public decimal Amount { get; set; }

    /// <summary>How much has been received so far. Outstanding = Amount - AmountPaid.</summary>
    public decimal AmountPaid { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public PaymentMethod? PaymentMethod { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Amount still owed on this sale.</summary>
    public decimal Outstanding => Amount - AmountPaid;
}
