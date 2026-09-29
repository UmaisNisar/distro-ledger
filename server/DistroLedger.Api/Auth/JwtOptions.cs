namespace DistroLedger.Api.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "DistroLedger";
    public string Audience { get; set; } = "DistroLedger";
    public int ExpiryDays { get; set; } = 30;
}
