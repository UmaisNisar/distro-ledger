using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Tests;

public sealed class TestTenantProvider : ITenantProvider
{
    public Guid? TenantId { get; set; }
}

public static class TestDb
{
    /// <summary>Creates an in-memory context sharing a named store, with a settable tenant.</summary>
    public static AppDbContext Create(string dbName, TestTenantProvider provider)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options, provider);
    }
}
