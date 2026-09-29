using DistroLedger.Api.Services;
using Xunit;

namespace DistroLedger.Tests;

public class InvoiceNumberServiceTests
{
    [Fact]
    public async Task Numbers_increment_per_tenant_year_and_reset_each_year()
    {
        var dbName = Guid.NewGuid().ToString();
        var provider = new TestTenantProvider();
        var tenant = Guid.NewGuid();

        string n1, n2, n3, nextYear;
        using (var db = TestDb.Create(dbName, provider))
        {
            var svc = new InvoiceNumberService(db);
            n1 = await svc.NextAsync(tenant, "INV", 2026, default); await db.SaveChangesAsync();
            n2 = await svc.NextAsync(tenant, "INV", 2026, default); await db.SaveChangesAsync();
            n3 = await svc.NextAsync(tenant, "INV", 2026, default); await db.SaveChangesAsync();
            nextYear = await svc.NextAsync(tenant, "INV", 2027, default); await db.SaveChangesAsync();
        }

        Assert.Equal("INV-2026-0001", n1);
        Assert.Equal("INV-2026-0002", n2);
        Assert.Equal("INV-2026-0003", n3);
        Assert.Equal("INV-2027-0001", nextYear);
    }

    [Fact]
    public async Task Different_tenants_have_independent_sequences()
    {
        var dbName = Guid.NewGuid().ToString();
        var provider = new TestTenantProvider();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();

        using var db = TestDb.Create(dbName, provider);
        var svc = new InvoiceNumberService(db);

        var a1 = await svc.NextAsync(a, "AAA", 2026, default); await db.SaveChangesAsync();
        var b1 = await svc.NextAsync(b, "BBB", 2026, default); await db.SaveChangesAsync();

        Assert.Equal("AAA-2026-0001", a1);
        Assert.Equal("BBB-2026-0001", b1);
    }
}
