namespace BookManager.Api.Dtos;

public record AuthorDto(int Id, string Name);

/// <summary>Book as returned by the list and detail endpoints (includes its authors).</summary>
public record BookDto(
    int Id,
    string Title,
    string ShortDescription,
    DateOnly PublishDate,
    IReadOnlyList<AuthorDto> Authors);

/// <summary>A single change-log row, with a precomputed <see cref="Date"/> (yyyy-MM-dd) for grouping.</summary>
public record BookChangeDto(
    int Id,
    int BookId,
    DateTime Timestamp,
    string Date,
    string Field,
    string ChangeType,
    string? OldValue,
    string? NewValue,
    string Description);
