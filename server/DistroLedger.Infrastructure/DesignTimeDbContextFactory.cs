using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DistroLedger.Infrastructure;

/// <summary>
/// Lets `dotnet ef` create the context at design time (migrations) without the API's DI.
/// Uses a null tenant so query filters resolve to Guid.Empty — irrelevant for schema.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var conn = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
                   ?? "Host=localhost;Port=5432;Database=distroledger;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(conn)
            .Options;
        return new AppDbContext(options, new NullTenantProvider());
    }

    private sealed class NullTenantProvider : ITenantProvider
    {
        public Guid? TenantId => null;
    }
}
