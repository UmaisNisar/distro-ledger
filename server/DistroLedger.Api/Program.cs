using System.Text;
using System.Text.Json.Serialization;
using DistroLedger.Api;
using DistroLedger.Api.Auth;
using DistroLedger.Api.Endpoints;
using DistroLedger.Api.Services;
using DistroLedger.Infrastructure;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---- Config ----
var connectionString = ConnectionStringHelper.Normalize(
    builder.Configuration.GetConnectionString("Postgres")
    ?? builder.Configuration["ConnectionStrings:Postgres"]
    ?? builder.Configuration["DATABASE_URL"]);

var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwt = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Secret))
    jwt.Secret = builder.Configuration["Jwt:Secret"] ?? "dev-only-insecure-secret-change-me-please-change-in-prod";
// Bind config, then ensure the resolved secret (incl. fallback) is what IOptions serves,
// so TokenService (signing) and JwtBearer (validation) always use the SAME key.
builder.Services.Configure<JwtOptions>(jwtSection);
builder.Services.PostConfigure<JwtOptions>(o =>
{
    if (string.IsNullOrWhiteSpace(o.Secret)) o.Secret = jwt.Secret;
});

// ---- JSON: serialize enums as strings ----
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ---- Database ----
// Skipped under the "Testing" environment so integration tests can register their own
// in-memory provider (EF Core allows only one provider per service provider).
var isTesting = builder.Environment.IsEnvironment("Testing");
if (!isTesting)
{
    var effectiveConn = string.IsNullOrWhiteSpace(connectionString)
        ? "Host=localhost;Database=distroledger;Username=postgres;Password=postgres"
        : connectionString;
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(effectiveConn));
}

// ---- Tenant resolution + app services ----
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<InvoiceNumberService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddValidatorsFromAssemblyContaining<OnboardingRequestValidator>();

// ---- Auth ----
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret))
        };
    });
builder.Services.AddAuthorization();

// ---- CORS ----
var origins = (builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(o => o.AddPolicy("web", p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddOpenApi();

var app = builder.Build();

// ---- Apply migrations on startup (self-provisions a fresh Neon DB) ----
if (!isTesting &&
    !string.IsNullOrWhiteSpace(connectionString) &&
    builder.Configuration.GetValue("RunMigrations", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsRelational())
        db.Database.Migrate();
}

app.UseCors("web");
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapGet("/", () => Results.Ok(new { service = "DistroLedger API", status = "ok" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapAuthEndpoints();
app.MapCustomerEndpoints();
app.MapSaleEndpoints();
app.MapDashboardEndpoints();
app.MapReceivablesEndpoints();
app.MapImportExportEndpoints();

app.Run();

// Exposed for WebApplicationFactory in tests.
public partial class Program { }
