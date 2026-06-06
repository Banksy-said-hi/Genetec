using System.Collections;
using System.ComponentModel.DataAnnotations;

namespace BookManager.Api.Dtos.Validation;

/// <summary>
/// Validates a collection of strings: bounds the number of elements
/// (<see cref="MaxCount"/>), and requires each element to be non-blank and no longer than
/// <see cref="MaxElementLength"/>. Keeps unbounded or oversized lists from reaching the database
/// (which would otherwise throw at save time). Pure and DB-free so it is fully unit-testable.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class StringCollectionAttribute : ValidationAttribute
{
    /// <summary>Maximum number of elements allowed in the collection.</summary>
    public int MaxCount { get; init; } = int.MaxValue;

    /// <summary>Maximum length allowed for any single element.</summary>
    public int MaxElementLength { get; init; } = int.MaxValue;

    /// <summary>Validates the collection; null is treated as valid so it composes with <see cref="RequiredAttribute"/>.</summary>
    /// <param name="value">The collection being validated.</param>
    /// <param name="validationContext">Context describing the member under validation.</param>
    /// <returns><see cref="ValidationResult.Success"/> when valid; otherwise a result with an error message.</returns>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null) return ValidationResult.Success;

        if (value is not IEnumerable enumerable || value is string)
            return Fail(validationContext, $"{validationContext.DisplayName} must be a collection of strings.");

        var items = enumerable.Cast<object?>().ToList();

        if (items.Count > MaxCount)
            return Fail(validationContext, $"{validationContext.DisplayName} must contain at most {MaxCount} items.");

        foreach (var item in items)
        {
            if (item is not string text || string.IsNullOrWhiteSpace(text))
                return Fail(validationContext, $"{validationContext.DisplayName} must not contain blank items.");

            if (text.Length > MaxElementLength)
                return Fail(validationContext,
                    $"{validationContext.DisplayName} items must be at most {MaxElementLength} characters.");
        }

        return ValidationResult.Success;
    }

    private ValidationResult Fail(ValidationContext context, string fallbackMessage) =>
        new(ErrorMessage ?? fallbackMessage, new[] { context.MemberName! });
}
