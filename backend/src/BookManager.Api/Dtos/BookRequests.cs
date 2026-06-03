using System.ComponentModel.DataAnnotations;

namespace BookManager.Api.Dtos;

/// <summary>
/// Create/update payload. Authors are supplied by name; the server find-or-creates each one,
/// which lets the autocomplete pass either an existing author or a brand-new typed name.
/// </summary>
public record BookInput(
    [Required, MaxLength(500)] string Title,
    [Required, MaxLength(2000)] string ShortDescription,
    DateOnly PublishDate,
    IReadOnlyList<string> AuthorNames);
