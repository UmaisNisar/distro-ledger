using DistroLedger.Api.Auth;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;

namespace DistroLedger.Api;

/// <summary>
/// Seeds a demo company with customers and sales for the local in-memory demo mode,
/// so the dashboard, receivables and charts are populated on first load.
/// Login: slug "demo", password "demo1234".
/// </summary>
public static class DemoSeeder
{
    public static void Seed(AppDbContext db, PasswordHasher hasher)
    {
        if (db.Tenants.Any()) return;

        var tenant = new Tenant
        {
            Name = "Demo Traders",
            Slug = "demo",
            PasswordHash = hasher.Hash("demo1234"),
            ThemeColor = "#17613F",
            CurrencyCode = "PKR",
            CurrencySymbol = "Rs",
            TaxIdLabel = "NTN #",
            InvoicePrefix = "INV",
            City = "Islamabad",
            Phone = "+92 300 1234567",
            Address = "Warehouse 4, I-9 Industrial Area",
        };
        db.Tenants.Add(tenant);

        var names = new (string name, string? ntn, string? city)[]
        {
            ("Zee Mart", "0018406", "B-17"),
            ("Jutt Milk Shop", "C 105079-4", "B-17"),
            ("Al Falah Hospital", "9978212", "D-17"),
            ("Shopex Cash & Carry", "6110130344407", "B-17"),
            ("Khan CNG", "37405-74807015", "D-17"),
            ("White Rose Super Store", "3740599747357", "B-17"),
            ("Family Mart", null, "B-17"),
            ("Zama Mart", "E-252036-0", "D-17"),
        };

        var customers = names.Select(n => new Customer
        {
            TenantId = tenant.Id,
            Name = n.name,
            TaxId = n.ntn,
            City = n.city,
        }).ToList();
        db.Customers.AddRange(customers);

        var rng = new Random(42);
        var today = DateTime.UtcNow.Date;
        var methods = new[] { PaymentMethod.Cash, PaymentMethod.Bank, PaymentMethod.Cheque, PaymentMethod.Credit };
        var counter = 0;
        var year = today.Year;

        // Spread ~60 sales across the last ~5 months.
        for (var i = 0; i < 60; i++)
        {
            var daysAgo = rng.Next(0, 150);
            var date = DateTime.SpecifyKind(today.AddDays(-daysAgo), DateTimeKind.Utc);
            var customer = customers[rng.Next(customers.Count)];
            var amount = rng.Next(15, 300) * 100m; // 1,500 – 30,000
            // ~55% paid, ~20% partial, ~25% unpaid
            var roll = rng.NextDouble();
            var paid = roll < 0.55 ? amount : roll < 0.75 ? Math.Round(amount * 0.4m, 2) : 0m;
            var status = paid <= 0 ? PaymentStatus.Unpaid : paid >= amount ? PaymentStatus.Paid : PaymentStatus.Partial;

            db.Sales.Add(new Sale
            {
                TenantId = tenant.Id,
                InvoiceNumber = $"INV-{date.Year}-{++counter:0000}",
                Date = date,
                CustomerId = customer.Id,
                Amount = amount,
                AmountPaid = paid,
                PaymentStatus = status,
                PaymentMethod = methods[rng.Next(methods.Length)],
            });
        }

        db.InvoiceCounters.Add(new InvoiceCounter { TenantId = tenant.Id, Year = year, LastNumber = counter });
        db.SaveChanges();
    }
}
