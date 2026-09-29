using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DistroLedger.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DistroLedger.Api.Auth;

public class TokenService
{
    private readonly JwtOptions _opts;

    public TokenService(IOptions<JwtOptions> opts) => _opts = opts.Value;

    public (string token, DateTime expiresAt) Create(Tenant tenant)
    {
        var expires = DateTime.UtcNow.AddDays(_opts.ExpiryDays);
        var claims = new[]
        {
            new Claim(AuthClaims.TenantId, tenant.Id.ToString()),
            new Claim(AuthClaims.Slug, tenant.Slug),
            new Claim(JwtRegisteredClaimNames.Sub, tenant.Id.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
