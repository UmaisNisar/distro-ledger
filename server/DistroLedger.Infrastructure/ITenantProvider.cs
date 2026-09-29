namespace DistroLedger.Infrastructure;

/// <summary>
/// Supplies the current request's tenant id. Implemented in the API layer from the
/// authenticated JWT. The DbContext uses it to scope every query to one company.
/// </summary>
public interface ITenantProvider
{
    /// <summary>Current tenant id, or null when unauthenticated / not yet resolved.</summary>
    Guid? TenantId { get; }
}
