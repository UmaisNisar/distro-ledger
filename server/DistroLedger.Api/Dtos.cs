using DistroLedger.Domain;

namespace DistroLedger.Api;

// ---------- Auth / onboarding / settings ----------
public record OnboardingRequest(
    string Name,
    string Slug,
    string Password,
    string ThemeColor,
    string CurrencyCode,
    string CurrencySymbol,
    string TaxIdLabel,
    string InvoicePrefix,
    string? Address,
    string? Phone,
    string? City);

public record LoginRequest(string Slug, string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, TenantDto Company);

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string ThemeColor,
    string CurrencyCode,
    string CurrencySymbol,
    string TaxIdLabel,
    string InvoicePrefix,
    string? Address,
    string? Phone,
    string? City,
    string? LogoUrl);

public record UpdateSettingsRequest(
    string Name,
    string ThemeColor,
    string CurrencyCode,
    string CurrencySymbol,
    string TaxIdLabel,
    string InvoicePrefix,
    string? Address,
    string? Phone,
    string? City,
    string? LogoUrl);

// ---------- Customers ----------
public record CustomerDto(
    Guid Id,
    string Name,
    string? TaxId,
    string? OtherIds,
    string? Phone,
    string? Address,
    string? City,
    decimal TotalSales,
    DateTime CreatedAt);

public record CustomerRequest(
    string Name,
    string? TaxId,
    string? OtherIds,
    string? Phone,
    string? Address,
    string? City);

public record MonthBreakdown(int Month, string MonthName, decimal Sales, int Transactions);

public record CustomerSummaryDto(
    Guid CustomerId,
    string CustomerName,
    int Year,
    decimal YearSales,
    int YearTransactions,
    IReadOnlyList<MonthBreakdown> Months);

// ---------- Sales ----------
public record SaleDto(
    Guid Id,
    string InvoiceNumber,
    DateTime Date,
    Guid CustomerId,
    string CustomerName,
    decimal Amount,
    decimal AmountPaid,
    decimal Outstanding,
    PaymentStatus PaymentStatus,
    PaymentMethod? PaymentMethod,
    string? Notes,
    DateTime CreatedAt);

public record SaleRequest(
    DateTime Date,
    Guid CustomerId,
    decimal Amount,
    decimal AmountPaid,
    PaymentStatus PaymentStatus,
    PaymentMethod? PaymentMethod,
    string? Notes);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record InvoiceDto(TenantDto Company, CustomerDto Customer, SaleDto Sale);

// ---------- Dashboard ----------
public record MonthTotal(int Month, string MonthName, decimal Total, int Transactions);

public record MonthlySummaryDto(int Year, IReadOnlyList<MonthTotal> Months, decimal YearTotal, int YearTransactions);

public record OverviewDto(
    decimal MonthSales,
    int MonthTransactions,
    decimal YearSales,
    decimal TotalOutstanding,
    int CustomerCount,
    IReadOnlyList<MonthTotal> Trend);

// ---------- Receivables ----------
public record ReceivableCustomer(
    Guid CustomerId,
    string CustomerName,
    decimal Outstanding,
    int OpenInvoices,
    DateTime? OldestDate,
    decimal Current,       // <= 30 days old
    decimal Days31To60,
    decimal Days61To90,
    decimal Days90Plus);

public record ReceivablesDto(decimal TotalOutstanding, IReadOnlyList<ReceivableCustomer> Customers);

// ---------- Import ----------
public record ImportResult(int Imported, int Skipped, IReadOnlyList<string> Errors);

// ---------- Admin (platform owner) ----------
public record AdminLoginRequest(string Username, string Password);

public record AdminAuthResponse(string Token, DateTime ExpiresAt, string Username);

public record CreateCompanyRequest(
    string Name,
    string Slug,
    string? Password,          // blank => auto-generated and returned
    string? ThemeColor,
    string? CurrencyCode,
    string? CurrencySymbol,
    string? TaxIdLabel,
    string? InvoicePrefix,
    string? Address,
    string? Phone,
    string? City);

public record CompanyAdminDto(
    Guid Id,
    string Name,
    string Slug,
    string CurrencyCode,
    string CurrencySymbol,
    int CustomerCount,
    int SaleCount,
    decimal TotalSales,
    DateTime CreatedAt);

/// <summary>Returned on create / reset — the plaintext password is shown only once.</summary>
public record CompanyCredentials(CompanyAdminDto Company, string Slug, string Password);
