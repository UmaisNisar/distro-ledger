namespace DistroLedger.Domain;

/// <summary>
/// A distribution company. One tenant == one company == one shared login (v1).
/// Created by the onboarding flow; holds branding + config used across the app.
/// </summary>
public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Company display name, e.g. "Salah Traders".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe unique handle used as the login identifier.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Hash of the single shared password for this company.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    // --- Branding / config captured during onboarding ---
    /// <summary>Accent color (hex, e.g. "#0A84FF"), used like iOS systemBlue.</summary>
    public string ThemeColor { get; set; } = "#0A84FF";

    /// <summary>ISO currency code, e.g. "PKR", "USD".</summary>
    public string CurrencyCode { get; set; } = "PKR";

    /// <summary>Currency symbol for display, e.g. "Rs", "$".</summary>
    public string CurrencySymbol { get; set; } = "Rs";

    /// <summary>Label for the customer tax id field, e.g. "NTN #", "Tax ID".</summary>
    public string TaxIdLabel { get; set; } = "NTN #";

    /// <summary>Prefix for auto-generated invoice numbers, e.g. "INV".</summary>
    public string InvoicePrefix { get; set; } = "INV";

    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? LogoUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
