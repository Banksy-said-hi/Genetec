using System.ComponentModel.DataAnnotations;

namespace BookManager.Api.Dtos.Validation;

/// <summary>
/// Validates that a string value is not null, empty, or whitespace-only. Complements
/// <see cref="RequiredAttribute"/>, which accepts a whitespace-only string such as <c>"   "</c>.
/// Pure and DB-free so it is fully unit-testable.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NotBlankAttribute : ValidationAttribute
{
    /// <summary>Validates the value, treating null as valid so it composes with <see cref="RequiredAttribute"/>.</summary>
    /// <param name="value">The value being validated.</param>
    /// <param name="validationContext">Context describing the member under validation.</param>
    /// <returns><see cref="ValidationResult.Success"/> when valid; otherwise a result with an error message.</returns>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // Defer null-handling to [Required]; only fail on a present-but-blank string.
        if (value is null) return ValidationResult.Success;

        if (value is not string text)
            return new ValidationResult($"{validationContext.DisplayName} must be a string.");

        return string.IsNullOrWhiteSpace(text)
            ? new ValidationResult(ErrorMessage ?? $"{validationContext.DisplayName} must not be blank.",
                new[] { validationContext.MemberName! })
            : ValidationResult.Success;
    }
}
