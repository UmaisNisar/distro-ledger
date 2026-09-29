using DistroLedger.Domain;

namespace DistroLedger.Api;

public static class Mapping
{
    public static TenantDto ToDto(this Tenant t) => new(
        t.Id, t.Name, t.Slug, t.ThemeColor, t.CurrencyCode, t.CurrencySymbol,
        t.TaxIdLabel, t.InvoicePrefix, t.Address, t.Phone, t.City, t.LogoUrl);

    public static CustomerDto ToDto(this Customer c, decimal totalSales) => new(
        c.Id, c.Name, c.TaxId, c.OtherIds, c.Phone, c.Address, c.City, totalSales, c.CreatedAt);

    public static SaleDto ToDto(this Sale s, string customerName) => new(
        s.Id, s.InvoiceNumber, s.Date, s.CustomerId, customerName,
        s.Amount, s.AmountPaid, s.Amount - s.AmountPaid,
        s.PaymentStatus, s.PaymentMethod, s.Notes, s.CreatedAt);
}
