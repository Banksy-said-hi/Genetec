using System.ComponentModel.DataAnnotations;
using BookManager.Api.Dtos.Validation;

namespace BookManager.Api.Dtos;

/// <summary>
/// Create/update payload. Authors are supplied by name; the server find-or-creates each one,
/// which lets the autocomplete pass either an existing author or a brand-new typed name.
/// All bounds are enforced server-side so malformed input fails with a 400 rather than a 500.
/// </summary>
/// <remarks>
/// Declared with explicit init properties (not a positional record): MVC requires DataAnnotations
/// to live on properties here, and it rejects validation metadata on a record's primary-constructor
/// parameters.
/// </remarks>
public record BookInput
{
    /// <summary>Book title; required, non-blank, up to 500 characters.</summary>
    [Required, NotBlank, MaxLength(500)]
    public string Title { get; init; } = string.Empty;

    /// <summary>Short description; required, non-blank, up to 2000 characters.</summary>
    [Required, NotBlank, MaxLength(2000)]
    public string ShortDescription { get; init; } = string.Empty;

    /// <summary>Publish date.</summary>
    public DateOnly PublishDate { get; init; }

    /// <summary>Author names; up to 20 entries, each non-blank and up to 300 characters.</summary>
    [StringCollection(MaxCount = 20, MaxElementLength = 300)]
    public IReadOnlyList<string> AuthorNames { get; init; } = [];
}
