using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DistroLedger.Api;
using Xunit;

namespace DistroLedger.Tests;

public class AdminIntegrationTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public AdminIntegrationTests(ApiFactory factory) => _factory = factory;

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/admin/login",
            new { username = "admin", password = ApiFactory.AdminPassword });
        res.EnsureSuccessStatusCode();
        var auth = await res.Content.ReadFromJsonAsync<AdminAuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    [Fact]
    public async Task Admin_login_rejects_wrong_password()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/admin/login", new { username = "admin", password = "nope" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Admin_endpoints_require_admin_token()
    {
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/companies")).StatusCode);
    }

    [Fact]
    public async Task Admin_creates_company_with_generated_password_that_can_log_in()
    {
        var admin = await AdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/admin/companies",
            new { name = "Provisioned Co", slug = "provisioned-co" });
        created.EnsureSuccessStatusCode();
        var creds = await created.Content.ReadFromJsonAsync<CompanyCredentials>(Json);
        Assert.False(string.IsNullOrWhiteSpace(creds!.Password));

        // The provisioned company can log in with the generated password.
        var login = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { slug = "provisioned-co", password = creds.Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task Admin_reset_password_invalidates_old_and_issues_new()
    {
        var admin = await AdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/admin/companies",
            new { name = "Reset Co", slug = "reset-co", password = "original123" });
        created.EnsureSuccessStatusCode();
        var id = (await created.Content.ReadFromJsonAsync<CompanyCredentials>(Json))!.Company.Id;

        var reset = await admin.PostAsJsonAsync($"/api/admin/companies/{id}/reset-password", new { });
        reset.EnsureSuccessStatusCode();
        var newPassword = (await reset.Content.ReadFromJsonAsync<CompanyCredentials>(Json))!.Password;

        var tenant = _factory.CreateClient();
        var oldLogin = await tenant.PostAsJsonAsync("/api/auth/login", new { slug = "reset-co", password = "original123" });
        Assert.Equal(HttpStatusCode.Unauthorized, oldLogin.StatusCode);

        var newLogin = await tenant.PostAsJsonAsync("/api/auth/login", new { slug = "reset-co", password = newPassword });
        Assert.Equal(HttpStatusCode.OK, newLogin.StatusCode);
    }

    [Fact]
    public async Task Admin_can_list_and_delete_a_company()
    {
        var admin = await AdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/admin/companies",
            new { name = "Temp Co", slug = "temp-co" });
        var id = (await created.Content.ReadFromJsonAsync<CompanyCredentials>(Json))!.Company.Id;

        var list = await admin.GetFromJsonAsync<CompanyAdminDto[]>("/api/admin/companies", Json);
        Assert.Contains(list!, c => c.Slug == "temp-co");

        var del = await admin.DeleteAsync($"/api/admin/companies/{id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
    }
}
