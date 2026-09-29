namespace DistroLedger.Api.Auth;

/// <summary>
/// Platform administrator credentials (you). Configured via appsettings / env vars
/// (Admin__Username, Admin__Password). If Password is blank, admin login is disabled.
/// </summary>
public class AdminOptions
{
    public const string SectionName = "Admin";

    public string Username { get; set; } = "admin";
    public string Password { get; set; } = string.Empty;
}
