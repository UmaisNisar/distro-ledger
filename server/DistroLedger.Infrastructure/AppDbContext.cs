using DistroLedger.Domain;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Infrastructure;

public class AppDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<InvoiceCounter> InvoiceCounters => Set<InvoiceCounter>();

    /// <summary>Current tenant id used by the global query filters.</summary>
    public Guid CurrentTenantId => _tenantProvider.TenantId ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(80);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.ThemeColor).HasMaxLength(9);
            e.Property(x => x.CurrencyCode).HasMaxLength(8);
            e.Property(x => x.CurrencySymbol).HasMaxLength(8);
            e.Property(x => x.TaxIdLabel).HasMaxLength(40);
            e.Property(x => x.InvoicePrefix).HasMaxLength(16);
        });

        b.Entity<Customer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(300);
            e.HasIndex(x => new { x.TenantId, x.Name });
            e.HasOne(x => x.Tenant).WithMany(t => t.Customers)
                .HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(x => x.TenantId == CurrentTenantId);
        });

        b.Entity<Sale>(e =>
        {
            e.HasKey(x => x.Id);
            e.Ignore(x => x.Outstanding);
            e.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(40);
            e.Property(x => x.Amount).HasColumnType("numeric(14,2)");
            e.Property(x => x.AmountPaid).HasColumnType("numeric(14,2)");
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasIndex(x => new { x.TenantId, x.Date });
            e.HasIndex(x => new { x.TenantId, x.InvoiceNumber }).IsUnique();
            e.HasOne(x => x.Tenant).WithMany(t => t.Sales)
                .HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Customer).WithMany(c => c.Sales)
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => x.TenantId == CurrentTenantId);
        });

        b.Entity<InvoiceCounter>(e =>
        {
            e.HasKey(x => new { x.TenantId, x.Year });
        });
    }
}
