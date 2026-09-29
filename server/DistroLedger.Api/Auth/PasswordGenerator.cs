using System.Security.Cryptography;

namespace DistroLedger.Api.Auth;

public static class PasswordGenerator
{
    // Unambiguous alphabet (no 0/O/1/l/I) so credentials are easy to read aloud/type.
    private const string Alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string Generate(int length = 10)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        return string.Create(length, bytes, (span, b) =>
        {
            for (var i = 0; i < span.Length; i++)
                span[i] = Alphabet[b[i] % Alphabet.Length];
        });
    }
}
