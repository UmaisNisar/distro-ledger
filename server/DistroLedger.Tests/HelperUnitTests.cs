using DistroLedger.Api;
using DistroLedger.Api.Auth;
using Xunit;

namespace DistroLedger.Tests;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void Hash_then_verify_roundtrips()
    {
        var hash = _hasher.Hash("correct horse");
        Assert.True(_hasher.Verify("correct horse", hash));
    }

    [Fact]
    public void Verify_rejects_wrong_password()
    {
        var hash = _hasher.Hash("correct horse");
        Assert.False(_hasher.Verify("wrong", hash));
    }

    [Fact]
    public void Hashes_are_salted_and_differ_each_time()
    {
        Assert.NotEqual(_hasher.Hash("same"), _hasher.Hash("same"));
    }

    [Fact]
    public void Verify_handles_malformed_hash_gracefully()
    {
        Assert.False(_hasher.Verify("x", "not-a-valid-hash"));
    }
}

public class ConnectionStringHelperTests
{
    [Fact]
    public void Passes_through_native_npgsql_string()
    {
        const string cs = "Host=localhost;Database=db;Username=u;Password=p";
        Assert.Equal(cs, ConnectionStringHelper.Normalize(cs));
    }

    [Fact]
    public void Converts_postgres_url_to_npgsql()
    {
        var result = ConnectionStringHelper.Normalize(
            "postgres://user:pass@ep-cool.neon.tech:5432/neondb?sslmode=require");
        Assert.Contains("Host=ep-cool.neon.tech", result);
        Assert.Contains("Database=neondb", result);
        Assert.Contains("Username=user", result);
        Assert.Contains("Password=pass", result);
        Assert.Contains("Require", result); // SSL mode carried over
    }

    [Fact]
    public void Handles_null_and_empty()
    {
        Assert.Equal(string.Empty, ConnectionStringHelper.Normalize(null));
        Assert.Equal(string.Empty, ConnectionStringHelper.Normalize(""));
    }
}
