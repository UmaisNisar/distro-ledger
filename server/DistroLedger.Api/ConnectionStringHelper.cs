using Npgsql;

namespace DistroLedger.Api;

public static class ConnectionStringHelper
{
    /// <summary>
    /// Accepts either a native Npgsql key/value string or a `postgres://` URL
    /// (as Neon/Render/Heroku hand out) and returns a valid Npgsql string.
    /// </summary>
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw ?? string.Empty;
        if (!raw.StartsWith("postgres://") && !raw.StartsWith("postgresql://"))
            return raw;

        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Require,
        };

        // Carry over a couple of common query params if present.
        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = pair.Split('=', 2);
            if (kv.Length != 2) continue;
            if (kv[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase) &&
                Enum.TryParse<SslMode>(kv[1], true, out var mode))
                builder.SslMode = mode;
        }

        return builder.ConnectionString;
    }
}
