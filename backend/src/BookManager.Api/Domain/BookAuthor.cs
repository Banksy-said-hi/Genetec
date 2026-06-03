namespace BookManager.Api.Domain;

/// <summary>Join entity for the Book &lt;-&gt; Author many-to-many relationship.</summary>
public class BookAuthor
{
    public int BookId { get; set; }
    public Book Book { get; set; } = null!;

    public int AuthorId { get; set; }
    public Author Author { get; set; } = null!;
}
