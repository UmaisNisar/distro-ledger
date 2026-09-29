using DistroLedger.Api.Auth;
using DistroLedger.Domain;
using DistroLedger.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DistroLedger.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- Onboarding: create a company (tenant) + its single login ----
        app.MapPost("/api/onboarding", async (
            OnboardingRequest req, AppDbContext db, PasswordHasher hasher, TokenService tokens, CancellationToken ct) =>
        {
            var slug = req.Slug.Trim().ToLowerInvariant();
            var exists = await db.Tenants.IgnoreQueryFilters().AnyAsync(t => t.Slug == slug, ct);
            if (exists)
                return Results.Conflict(new { message = "That company handle is already taken." });

            var tenant = new Tenant
            {
                Name = req.Name.Trim(),
                Slug = slug,
                PasswordHash = hasher.Hash(req.Password),
                ThemeColor = req.ThemeColor,
                CurrencyCode = req.CurrencyCode,
                CurrencySymbol = req.CurrencySymbol,
                TaxIdLabel = req.TaxIdLabel,
                InvoicePrefix = req.InvoicePrefix,
                Address = req.Address,
                Phone = req.Phone,
                City = req.City
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);

            var (token, expires) = tokens.Create(tenant);
            return Results.Ok(new AuthResponse(token, expires, tenant.ToDto()));
        })
        .ValidateBody<OnboardingRequest>()
        .AllowAnonymous();

        // ---- Login ----
        app.MapPost("/api/auth/login", async (
            LoginRequest req, AppDbContext db, PasswordHasher hasher, TokenService tokens, CancellationToken ct) =>
        {
            var slug = req.Slug.Trim().ToLowerInvariant();
            var tenant = await db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Slug == slug, ct);
            if (tenant is null || !hasher.Verify(req.Password, tenant.PasswordHash))
                return Results.Unauthorized();

            var (token, expires) = tokens.Create(tenant);
            return Results.Ok(new AuthResponse(token, expires, tenant.ToDto()));
        })
        .ValidateBody<LoginRequest>()
        .AllowAnonymous();

        // ---- Current company (from JWT) ----
        app.MapGet("/api/settings", async (AppDbContext db, CancellationToken ct) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == db.CurrentTenantId, ct);
            return tenant is null ? Results.NotFound() : Results.Ok(tenant.ToDto());
        })
        .RequireAuthorization();

        // ---- Update company branding / config ----
        app.MapPut("/api/settings", async (
            UpdateSettingsRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == db.CurrentTenantId, ct);
            if (tenant is null) return Results.NotFound();

            tenant.Name = req.Name.Trim();
            tenant.ThemeColor = req.ThemeColor;
            tenant.CurrencyCode = req.CurrencyCode;
            tenant.CurrencySymbol = req.CurrencySymbol;
            tenant.TaxIdLabel = req.TaxIdLabel;
            tenant.InvoicePrefix = req.InvoicePrefix;
            tenant.Address = req.Address;
            tenant.Phone = req.Phone;
            tenant.City = req.City;
            tenant.LogoUrl = req.LogoUrl;
            await db.SaveChangesAsync(ct);

            return Results.Ok(tenant.ToDto());
        })
        .ValidateBody<UpdateSettingsRequest>()
        .RequireAuthorization();
    }
}
