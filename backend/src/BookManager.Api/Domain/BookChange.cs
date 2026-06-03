namespace BookManager.Api.Domain;

/// <summary>
/// One row in the change log. Editing several fields in a single save emits multiple rows
/// sharing one <see cref="Timestamp"/>. <see cref="Description"/> is the human-readable sentence
/// computed at write time; the structured fields are stored alongside for filter/sort/group.
/// </summary>
public class BookChange
{
    public int Id { get; set; }

    public int BookId { get; set; }
    public Book Book { get; set; } = null!;

    /// <summary>UTC instant of the save that produced this row.</summary>
    public DateTime Timestamp { get; set; }

    /// <summary>The field that changed, e.g. "Title", "ShortDescription", "PublishDate", "Authors".</summary>
    public string Field { get; set; } = string.Empty;

    public ChangeType ChangeType { get; set; }

    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    /// <summary>Pre-built sentence, e.g. <c>Title was changed to "The Hobbit"</c>.</summary>
    public string Description { get; set; } = string.Empty;
}
