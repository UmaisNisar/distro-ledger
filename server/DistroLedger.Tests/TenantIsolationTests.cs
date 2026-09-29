using DistroLedger.Domain;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DistroLedger.Tests;

public class TenantIsolationTests
{
    [Fact]
    public async Task Customers_and_sales_are_scoped_to_the_current_tenant()
    {
        var dbName = Guid.NewGuid().ToString();
        var provider = new TestTenantProvider();

        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        // Seed both tenants (writes are not filtered).
        using (var db = TestDb.Create(dbName, provider))
        {
            var custA = new Customer { TenantId = tenantA, Name = "Mart A" };
            var custB = new Customer { TenantId = tenantB, Name = "Mart B" };
            db.Customers.AddRange(custA, custB);
            db.Sales.Add(new Sale { TenantId = tenantA, CustomerId = custA.Id, InvoiceNumber = "A-1", Amount = 100, Date = DateTime.UtcNow });
            db.Sales.Add(new Sale { TenantId = tenantB, CustomerId = custB.Id, InvoiceNumber = "B-1", Amount = 200, Date = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }

        // Reads as tenant A see only A.
        using (var db = TestDb.Create(dbName, provider))
        {
            provider.TenantId = tenantA;
            var customers = await db.Customers.ToListAsync();
            var sales = await db.Sales.ToListAsync();

            Assert.Single(customers);
            Assert.Equal("Mart A", customers[0].Name);
            Assert.Single(sales);
            Assert.Equal("A-1", sales[0].InvoiceNumber);
        }

        // Reads as tenant B see only B.
        using (var db = TestDb.Create(dbName, provider))
        {
            provider.TenantId = tenantB;
            var sales = await db.Sales.ToListAsync();
            Assert.Single(sales);
            Assert.Equal("B-1", sales[0].InvoiceNumber);
        }
    }

    [Fact]
    public void Outstanding_is_amount_minus_paid()
    {
        var sale = new Sale { Amount = 1000, AmountPaid = 300 };
        Assert.Equal(700, sale.Outstanding);
    }
}
