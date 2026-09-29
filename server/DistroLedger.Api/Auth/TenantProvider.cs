using System.Security.Claims;
using DistroLedger.Infrastructure;

namespace DistroLedger.Api.Auth;

/// <summary>Resolves the current tenant id from the authenticated JWT.</summary>
public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _accessor;

    public TenantProvider(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid? TenantId
    {
        get
        {
            var value = _accessor.HttpContext?.User.FindFirstValue(AuthClaims.TenantId);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}

public static class AuthClaims
{
    public const string TenantId = "tenantId";
    public const string Slug = "slug";
}
