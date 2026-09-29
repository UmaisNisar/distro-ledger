using FluentValidation;

namespace DistroLedger.Api;

/// <summary>
/// Endpoint filter that runs a FluentValidation validator on the first argument of type T
/// and returns RFC7807 validation problems when invalid.
/// </summary>
public class ValidationFilter<T> : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is not null)
        {
            var arg = context.Arguments.OfType<T>().FirstOrDefault();
            if (arg is not null)
            {
                var result = await validator.ValidateAsync(arg);
                if (!result.IsValid)
                {
                    var errors = result.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                    return Results.ValidationProblem(errors);
                }
            }
        }
        return await next(context);
    }
}

public static class ValidationFilterExtensions
{
    public static RouteHandlerBuilder ValidateBody<T>(this RouteHandlerBuilder builder)
        => builder.AddEndpointFilter<ValidationFilter<T>>();
}
