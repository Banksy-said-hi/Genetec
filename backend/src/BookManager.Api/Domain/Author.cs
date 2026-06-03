namespace BookManager.Api.Domain;

/// <summary>An author. Stored in its own table; <see cref="Name"/> is indexed for search.</summary>
public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<BookAuthor> BookAuthors { get; set; } = new List<BookAuthor>();
}
