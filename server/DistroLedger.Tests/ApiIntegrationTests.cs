using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DistroLedger.Api;
using Xunit;

namespace DistroLedger.Tests;

public class ApiIntegrationTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public ApiIntegrationTests(ApiFactory factory) => _factory = factory;

    // ---- helpers ----
    private static object OnboardBody(string slug) => new
    {
        name = slug + " co",
        slug,
        password = "secret123",
        themeColor = "#0A84FF",
        currencyCode = "PKR",
        currencySymbol = "Rs",
        taxIdLabel = "NTN #",
        invoicePrefix = "INV",
        address = (string?)null,
        phone = (string?)null,
        city = (string?)null,
    };

    private async Task<HttpClient> OnboardClientAsync(string slug)
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/onboarding", OnboardBody(slug));
        res.EnsureSuccessStatusCode();
        var auth = await res.Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static async Task<Guid> CreateCustomerAsync(HttpClient client, string name)
    {
        var res = await client.PostAsJsonAsync("/api/customers", new { name });
        res.EnsureSuccessStatusCode();
        var c = await res.Content.ReadFromJsonAsync<CustomerDto>(Json);
        return c!.Id;
    }

    // ---- tests ----
    [Fact]
    public async Task Onboarding_returns_token_and_authorizes_requests()
    {
        var client = await OnboardClientAsync("acme");
        var settings = await client.GetAsync("/api/settings");
        Assert.Equal(HttpStatusCode.OK, settings.StatusCode);
        var company = await settings.Content.ReadFromJsonAsync<TenantDto>(Json);
        Assert.Equal("acme", company!.Slug);
    }

    [Fact]
    public async Task Protected_endpoint_without_token_is_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/sales?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Duplicate_slug_is_conflict()
    {
        var client = _factory.CreateClient();
        (await client.PostAsJsonAsync("/api/onboarding", OnboardBody("dupe"))).EnsureSuccessStatusCode();
        var second = await client.PostAsJsonAsync("/api/onboarding", OnboardBody("dupe"));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Login_succeeds_with_correct_password_and_fails_otherwise()
    {
        var client = _factory.CreateClient();
        (await client.PostAsJsonAsync("/api/onboarding", OnboardBody("loginco"))).EnsureSuccessStatusCode();

        var ok = await client.PostAsJsonAsync("/api/auth/login", new { slug = "loginco", password = "secret123" });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        var bad = await client.PostAsJsonAsync("/api/auth/login", new { slug = "loginco", password = "wrong" });
        Assert.Equal(HttpStatusCode.Unauthorized, bad.StatusCode);
    }

    [Fact]
    public async Task Invalid_onboarding_slug_is_400()
    {
        var client = _factory.CreateClient();
        var body = new
        {
            name = "Bad", slug = "Bad Slug!", password = "secret123", themeColor = "#0A84FF",
            currencyCode = "PKR", currencySymbol = "Rs", taxIdLabel = "NTN #", invoicePrefix = "INV",
            address = (string?)null, phone = (string?)null, city = (string?)null,
        };
        var res = await client.PostAsJsonAsync("/api/onboarding", body);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Full_sales_flow_rolls_up_into_dashboard_and_receivables()
    {
        var client = await OnboardClientAsync("flowco");
        var customerId = await CreateCustomerAsync(client, "Zee Mart");

        var saleRes = await client.PostAsJsonAsync("/api/sales", new
        {
            date = "2026-02-01",
            customerId,
            amount = 1000m,
            amountPaid = 300m,
            paymentStatus = "Unpaid", // ignored; derived server-side
            paymentMethod = "Cash",
            notes = (string?)null,
        });
        saleRes.EnsureSuccessStatusCode();
        var sale = await saleRes.Content.ReadFromJsonAsync<SaleDto>(Json);
        Assert.Equal("INV-2026-0001", sale!.InvoiceNumber);
        Assert.Equal("Partial", sale.PaymentStatus.ToString()); // 300 of 1000
        Assert.Equal(700m, sale.Outstanding);

        var overview = await client.GetFromJsonAsync<OverviewDto>("/api/dashboard/overview", Json);
        Assert.Equal(1000m, overview!.YearSales);
        Assert.Equal(700m, overview.TotalOutstanding);
        Assert.Equal(1, overview.CustomerCount);

        var receivables = await client.GetFromJsonAsync<ReceivablesDto>("/api/receivables", Json);
        Assert.Equal(700m, receivables!.TotalOutstanding);
        Assert.Single(receivables.Customers);
    }

    [Fact]
    public async Task Sale_with_paid_over_amount_is_rejected()
    {
        var client = await OnboardClientAsync("valco");
        var customerId = await CreateCustomerAsync(client, "Some Mart");
        var res = await client.PostAsJsonAsync("/api/sales", new
        {
            date = "2026-02-01", customerId, amount = 100m, amountPaid = 200m,
            paymentStatus = "Unpaid", paymentMethod = (string?)null, notes = (string?)null,
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Tenants_cannot_see_each_others_data()
    {
        var a = await OnboardClientAsync("tenant-a");
        var b = await OnboardClientAsync("tenant-b");

        var aCustomerId = await CreateCustomerAsync(a, "A Mart");

        // B lists customers -> none
        var bList = await b.GetFromJsonAsync<CustomerDto[]>("/api/customers", Json);
        Assert.Empty(bList!);

        // B cannot fetch A's customer by id
        var bGet = await b.GetAsync($"/api/customers/{aCustomerId}");
        Assert.Equal(HttpStatusCode.NotFound, bGet.StatusCode);

        // A still sees its own
        var aList = await a.GetFromJsonAsync<CustomerDto[]>("/api/customers", Json);
        Assert.Single(aList!);
    }

    [Fact]
    public async Task Csv_import_creates_customers_and_unique_gapless_invoice_numbers()
    {
        var client = await OnboardClientAsync("importco");

        var csv = string.Join("\n", new[]
        {
            "Date,Invoice #,Customer Name,NTN #,Amount (PKR),Payment Status,Payment Method,Notes",
            "01-Feb-2026,,ZEE MART,0018406,18640,Paid,Cash,",
            "02-Feb-2026,,JUTT MILK SHOP,C 105079-4,23540,,,",
            "03-Feb-2026,,ZEE MART,0018406,1550,Unpaid,,repeat customer",
        });

        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(file, "file", "feb.csv");

        var res = await client.PostAsync("/api/import/sales", form);
        res.EnsureSuccessStatusCode();
        var result = await res.Content.ReadFromJsonAsync<ImportResult>(Json);
        Assert.Equal(3, result!.Imported);

        // Two unique customers (ZEE MART deduped)
        var customers = await client.GetFromJsonAsync<CustomerDto[]>("/api/customers", Json);
        Assert.Equal(2, customers!.Length);

        // Three sales with gapless, unique invoice numbers
        var sales = await client.GetFromJsonAsync<PagedResult<SaleDto>>("/api/sales?page=1&pageSize=50", Json);
        Assert.Equal(3, sales!.Total);
        var numbers = sales.Items.Select(s => s.InvoiceNumber).OrderBy(x => x).ToArray();
        Assert.Equal(new[] { "INV-2026-0001", "INV-2026-0002", "INV-2026-0003" }, numbers);

        // Dashboard total = 18640 + 23540 + 1550
        var overview = await client.GetFromJsonAsync<OverviewDto>("/api/dashboard/overview", Json);
        Assert.Equal(43730m, overview!.YearSales);
    }
}
