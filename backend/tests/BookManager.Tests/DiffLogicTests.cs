using BookManager.Api.Domain;
using BookManager.Api.Services;

namespace BookManager.Tests;

public class DiffLogicTests
{
    private static readonly DateTime Ts = new(2024, 6, 1, 10, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly Date = new(2020, 1, 1);

    private static Author Author(string name) => new() { Name = name };

    [Fact]
    public void Changing_one_field_emits_one_correctly_described_row()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "Old", newTitle: "The Hobbit",
            oldDescription: "same", newDescription: "same",
            oldPublishDate: Date, newPublishDate: Date,
            oldAuthors: new[] { Author("Tolkien") },
            newAuthors: new[] { Author("Tolkien") },
            timestamp: Ts);

        var change = Assert.Single(changes);
        Assert.Equal("Title", change.Field);
        Assert.Equal(ChangeType.Updated, change.ChangeType);
        Assert.Equal("Old", change.OldValue);
        Assert.Equal("The Hobbit", change.NewValue);
        Assert.Equal("Title was changed to \"The Hobbit\"", change.Description);
        Assert.Equal(Ts, change.Timestamp);
    }

    [Fact]
    public void Changing_multiple_fields_emits_multiple_rows_sharing_one_timestamp()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "Old", newTitle: "New",
            oldDescription: "Old desc", newDescription: "New desc",
            oldPublishDate: new DateOnly(2000, 1, 1), newPublishDate: new DateOnly(2001, 2, 3),
            oldAuthors: Array.Empty<Author>(),
            newAuthors: Array.Empty<Author>(),
            timestamp: Ts);

        Assert.Equal(3, changes.Count);
        Assert.All(changes, c => Assert.Equal(Ts, c.Timestamp));
        Assert.Contains(changes, c => c.Field == "Title");
        Assert.Contains(changes, c => c.Field == "ShortDescription");
        Assert.Contains(changes, c => c.Field == "PublishDate");
    }

    [Fact]
    public void No_change_emits_no_rows()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "Same", newTitle: "Same",
            oldDescription: "Same", newDescription: "Same",
            oldPublishDate: Date, newPublishDate: Date,
            oldAuthors: new[] { Author("A"), Author("B") },
            newAuthors: new[] { Author("B"), Author("A") },
            timestamp: Ts);

        Assert.Empty(changes);
    }

    [Fact]
    public void Adding_an_author_emits_an_AuthorAdded_row()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "T", newTitle: "T",
            oldDescription: "D", newDescription: "D",
            oldPublishDate: Date, newPublishDate: Date,
            oldAuthors: new[] { Author("Tolkien") },
            newAuthors: new[] { Author("Tolkien"), Author("Lewis") },
            timestamp: Ts);

        var change = Assert.Single(changes);
        Assert.Equal(ChangeType.AuthorAdded, change.ChangeType);
        Assert.Equal("Authors", change.Field);
        Assert.Equal("Lewis", change.NewValue);
        Assert.Equal("Author \"Lewis\" was added", change.Description);
    }

    [Fact]
    public void Removing_an_author_emits_an_AuthorRemoved_row()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "T", newTitle: "T",
            oldDescription: "D", newDescription: "D",
            oldPublishDate: Date, newPublishDate: Date,
            oldAuthors: new[] { Author("Tolkien"), Author("Lewis") },
            newAuthors: new[] { Author("Tolkien") },
            timestamp: Ts);

        var change = Assert.Single(changes);
        Assert.Equal(ChangeType.AuthorRemoved, change.ChangeType);
        Assert.Equal("Lewis", change.OldValue);
        Assert.Equal("Author \"Lewis\" was removed", change.Description);
    }

    [Fact]
    public void PublishDate_change_stores_iso_values()
    {
        var changes = BookChangeFactory.BuildUpdateChanges(
            bookId: 1,
            oldTitle: "T", newTitle: "T",
            oldDescription: "D", newDescription: "D",
            oldPublishDate: new DateOnly(1999, 12, 31), newPublishDate: new DateOnly(2000, 1, 1),
            oldAuthors: Array.Empty<Author>(),
            newAuthors: Array.Empty<Author>(),
            timestamp: Ts);

        var change = Assert.Single(changes);
        Assert.Equal("1999-12-31", change.OldValue);
        Assert.Equal("2000-01-01", change.NewValue);
        Assert.Equal("Publish date was changed to 2000-01-01", change.Description);
    }
}
