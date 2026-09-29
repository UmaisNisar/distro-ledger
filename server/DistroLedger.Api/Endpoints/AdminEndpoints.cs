using DistroLedger.Api.Auth;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DistroLedger.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- Admin login (platform owner) ----
        app.MapPost("/api/admin/login", (
            AdminLoginRequest req, IOptions<AdminOptions> opts, TokenService tokens) =>
        {
            var admin = opts.Value;
            if (string.IsNullOrWhiteSpace(admin.Password))
                return Results.Problem("Admin access is not configured.", statusCode: 503);

            var ok = string.Equals(req.Username?.Trim(), admin.Username, StringComparison.OrdinalIgnoreCase)
                     && req.Password == admin.Password;
            if (!ok) return Results.Unauthorized();

            var (token, expires) = tokens.CreateAdmin(admin.Username);
            return Results.Ok(new AdminAuthResponse(token, expires, admin.Username));
        }).AllowAnonymous();

        var group = app.MapGroup("/api/admin").RequireAuthorization(AuthClaims.AdminPolicy);

        group.MapGet("/me", (IOptions<AdminOptions> opts) =>
            Results.Ok(new { username = opts.Value.Username }));

        // ---- List all companies with counts (cross-tenant) ----
        group.MapGet("/companies", async (AppDbContext db, CancellationToken ct) =>
        {
            var tenants = await db.Tenants.OrderBy(t => t.Name).ToListAsync(ct);

            var custCounts = await db.Customers.IgnoreQueryFilters()
                .GroupBy(c => c.TenantId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToListAsync(ct);

            var saleAgg = await db.Sales.IgnoreQueryFilters()
                .GroupBy(s => s.TenantId)
                .Select(g => new { g.Key, Count = g.Count(), Total = g.Sum(s => s.Amount) })
                .ToListAsync(ct);

            var result = tenants.Select(t => new CompanyAdminDto(
                t.Id, t.Name, t.Slug, t.CurrencyCode, t.CurrencySymbol,
                custCounts.FirstOrDefault(c => c.Key == t.Id)?.Count ?? 0,
                saleAgg.FirstOrDefault(s => s.Key == t.Id)?.Count ?? 0,
                saleAgg.FirstOrDefault(s => s.Key == t.Id)?.Total ?? 0m,
                t.CreatedAt));

            return Results.Ok(result);
        });

        // ---- Create a company (admin-provisioned) ----
        group.MapPost("/companies", async (
            CreateCompanyRequest req, AppDbContext db, PasswordHasher hasher, CancellationToken ct) =>
        {
            var slug = (req.Slug ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(slug))
                return Results.BadRequest(new { message = "Name and handle are required." });
            if (!System.Text.RegularExpressions.Regex.IsMatch(slug, "^[a-z0-9-]+$"))
                return Results.BadRequest(new { message = "Handle may contain only lowercase letters, numbers and hyphens." });
            if (await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
                return Results.Conflict(new { message = "That company handle is already taken." });

            var password = string.IsNullOrWhiteSpace(req.Password) ? PasswordGenerator.Generate() : req.Password!.Trim();

            var tenant = new Tenant
            {
                Name = req.Name.Trim(),
                Slug = slug,
                PasswordHash = hasher.Hash(password),
                ThemeColor = Blank(req.ThemeColor, "#0A84FF"),
                CurrencyCode = Blank(req.CurrencyCode, "PKR"),
                CurrencySymbol = Blank(req.CurrencySymbol, "Rs"),
                TaxIdLabel = Blank(req.TaxIdLabel, "NTN #"),
                InvoicePrefix = Blank(req.InvoicePrefix, "INV"),
                Address = req.Address,
                Phone = req.Phone,
                City = req.City,
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);

            var dto = new CompanyAdminDto(tenant.Id, tenant.Name, tenant.Slug, tenant.CurrencyCode,
                tenant.CurrencySymbol, 0, 0, 0m, tenant.CreatedAt);
            return Results.Ok(new CompanyCredentials(dto, tenant.Slug, password));
        });

        // ---- Reset a company's password ----
        group.MapPost("/companies/{id:guid}/reset-password", async (
            Guid id, AppDbContext db, PasswordHasher hasher, CancellationToken ct) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (tenant is null) return Results.NotFound();

            var password = PasswordGenerator.Generate();
            tenant.PasswordHash = hasher.Hash(password);
            await db.SaveChangesAsync(ct);

            var dto = new CompanyAdminDto(tenant.Id, tenant.Name, tenant.Slug, tenant.CurrencyCode,
                tenant.CurrencySymbol, 0, 0, 0m, tenant.CreatedAt);
            return Results.Ok(new CompanyCredentials(dto, tenant.Slug, password));
        });

        // ---- Delete a company (cascades customers + sales) ----
        group.MapDelete("/companies/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (tenant is null) return Results.NotFound();
            db.Tenants.Remove(tenant);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
    }

    private static string Blank(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}
