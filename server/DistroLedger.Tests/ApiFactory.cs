using DistroLedger.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace DistroLedger.Tests;

/// <summary>
/// Boots the real API in the "Testing" environment (where it skips registering Npgsql)
/// and provides a private in-memory database, so integration tests run end-to-end
/// through HTTP without Postgres — locally and in CI.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "itest-" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Secret", "integration-test-secret-key-long-enough-for-hmac256!!");

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });
    }
}
