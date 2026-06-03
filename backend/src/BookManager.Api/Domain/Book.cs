namespace BookManager.Api.Domain;

/// <summary>A book. Current state lives here; history lives in <see cref="BookChange"/>.</summary>
public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public DateOnly PublishDate { get; set; }

    public ICollection<BookAuthor> BookAuthors { get; set; } = new List<BookAuthor>();
    public ICollection<BookChange> Changes { get; set; } = new List<BookChange>();
}
