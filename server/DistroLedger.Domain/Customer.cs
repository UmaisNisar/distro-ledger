namespace DistroLedger.Domain;

/// <summary>
/// A customer of the distribution company (a mart, store, pharmacy, hospital, etc.).
/// Mirrors the "Customers" master sheet. Period sales are computed, never stored.
/// </summary>
public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Primary tax id (NTN # in the source sheet).</summary>
    public string? TaxId { get; set; }

    /// <summary>Free-form additional identifiers copied from source records.</summary>
    public string? OtherIds { get; set; }

    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
