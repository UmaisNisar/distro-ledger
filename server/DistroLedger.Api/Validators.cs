using FluentValidation;

namespace DistroLedger.Api;

public class OnboardingRequestValidator : AbstractValidator<OnboardingRequest>
{
    public OnboardingRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(80)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Slug may contain only lowercase letters, numbers and hyphens.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(200);
        RuleFor(x => x.ThemeColor).NotEmpty().Matches("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
            .WithMessage("Theme color must be a hex value like #0A84FF.");
        RuleFor(x => x.CurrencyCode).NotEmpty().MaximumLength(8);
        RuleFor(x => x.CurrencySymbol).NotEmpty().MaximumLength(8);
        RuleFor(x => x.TaxIdLabel).NotEmpty().MaximumLength(40);
        RuleFor(x => x.InvoicePrefix).NotEmpty().MaximumLength(16);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Slug).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class UpdateSettingsRequestValidator : AbstractValidator<UpdateSettingsRequest>
{
    public UpdateSettingsRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ThemeColor).NotEmpty().Matches("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$");
        RuleFor(x => x.CurrencyCode).NotEmpty().MaximumLength(8);
        RuleFor(x => x.CurrencySymbol).NotEmpty().MaximumLength(8);
        RuleFor(x => x.TaxIdLabel).NotEmpty().MaximumLength(40);
        RuleFor(x => x.InvoicePrefix).NotEmpty().MaximumLength(16);
    }
}

public class CustomerRequestValidator : AbstractValidator<CustomerRequest>
{
    public CustomerRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Phone).MaximumLength(40);
        RuleFor(x => x.City).MaximumLength(120);
    }
}

public class SaleRequestValidator : AbstractValidator<SaleRequest>
{
    public SaleRequestValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(x => x.Amount)
            .WithMessage("Amount paid cannot exceed the invoice amount.");
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
