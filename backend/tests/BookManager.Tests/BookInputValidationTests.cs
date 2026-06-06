using System.ComponentModel.DataAnnotations;
using BookManager.Api.Dtos;

namespace BookManager.Tests;

/// <summary>
/// Validates the DataAnnotations on <see cref="BookInput"/> via the same
/// <see cref="Validator"/> the framework runs, so malformed payloads are rejected with a 400
/// before they ever reach the service or database.
/// </summary>
public class BookInputValidationTests
{
    private static List<ValidationResult> Validate(BookInput input)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(input, new ValidationContext(input), results, validateAllProperties: true);
        return results;
    }

    private static BookInput Valid() => new()
    {
        Title = "The Hobbit",
        ShortDescription = "A short description.",
        PublishDate = new DateOnly(1937, 9, 21),
        AuthorNames = new[] { "J.R.R. Tolkien" },
    };

    [Fact]
    public void Valid_input_passes()
        => Assert.Empty(Validate(Valid()));

    [Fact]
    public void Blank_title_is_rejected()
        => Assert.Contains(Validate(Valid() with { Title = "   " }),
            r => r.MemberNames.Contains(nameof(BookInput.Title)));

    [Fact]
    public void Empty_description_is_rejected()
        => Assert.Contains(Validate(Valid() with { ShortDescription = "" }),
            r => r.MemberNames.Contains(nameof(BookInput.ShortDescription)));

    [Fact]
    public void Overlong_title_is_rejected()
        => Assert.Contains(Validate(Valid() with { Title = new string('x', 501) }),
            r => r.MemberNames.Contains(nameof(BookInput.Title)));

    [Fact]
    public void Overlong_author_name_is_rejected()
        => Assert.Contains(Validate(Valid() with { AuthorNames = new[] { new string('a', 301) } }),
            r => r.MemberNames.Contains(nameof(BookInput.AuthorNames)));

    [Fact]
    public void Blank_author_name_is_rejected()
        => Assert.Contains(Validate(Valid() with { AuthorNames = new[] { "Real Author", "  " } }),
            r => r.MemberNames.Contains(nameof(BookInput.AuthorNames)));

    [Fact]
    public void Too_many_authors_is_rejected()
        => Assert.Contains(
            Validate(Valid() with { AuthorNames = Enumerable.Range(0, 21).Select(i => $"Author {i}").ToArray() }),
            r => r.MemberNames.Contains(nameof(BookInput.AuthorNames)));

    [Fact]
    public void Empty_author_list_is_allowed()
        => Assert.Empty(Validate(Valid() with { AuthorNames = Array.Empty<string>() }));
}
