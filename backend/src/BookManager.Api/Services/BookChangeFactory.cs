using BookManager.Api.Domain;

namespace BookManager.Api.Services;

/// <summary>
/// Diffs a book's old state against the incoming state and produces one change row per changed
/// field. Pure and DB-free so it is fully unit-testable. All rows from a single save share the
/// one <c>timestamp</c> passed in; no change produces an empty list.
/// </summary>
public static class BookChangeFactory
{
    public static BookChange CreatedChange(Book book, DateTime timestamp) => new()
    {
        BookId = book.Id,
        Timestamp = timestamp,
        Field = "Book",
        ChangeType = ChangeType.Created,
        OldValue = null,
        NewValue = book.Title,
        Description = ChangeDescriber.Created(book.Title)
    };

    public static List<BookChange> BuildUpdateChanges(
        int bookId,
        string oldTitle, string newTitle,
        string oldDescription, string newDescription,
        DateOnly oldPublishDate, DateOnly newPublishDate,
        IReadOnlyCollection<Author> oldAuthors,
        IReadOnlyCollection<Author> newAuthors,
        DateTime timestamp)
    {
        var changes = new List<BookChange>();

        if (!string.Equals(oldTitle, newTitle, StringComparison.Ordinal))
        {
            changes.Add(new BookChange
            {
                BookId = bookId,
                Timestamp = timestamp,
                Field = nameof(Book.Title),
                ChangeType = ChangeType.Updated,
                OldValue = oldTitle,
                NewValue = newTitle,
                Description = ChangeDescriber.TitleChanged(newTitle)
            });
        }

        if (!string.Equals(oldDescription, newDescription, StringComparison.Ordinal))
        {
            changes.Add(new BookChange
            {
                BookId = bookId,
                Timestamp = timestamp,
                Field = nameof(Book.ShortDescription),
                ChangeType = ChangeType.Updated,
                OldValue = oldDescription,
                NewValue = newDescription,
                Description = ChangeDescriber.ShortDescriptionChanged(newDescription)
            });
        }

        if (oldPublishDate != newPublishDate)
        {
            changes.Add(new BookChange
            {
                BookId = bookId,
                Timestamp = timestamp,
                Field = nameof(Book.PublishDate),
                ChangeType = ChangeType.Updated,
                OldValue = oldPublishDate.ToString("yyyy-MM-dd"),
                NewValue = newPublishDate.ToString("yyyy-MM-dd"),
                Description = ChangeDescriber.PublishDateChanged(newPublishDate)
            });
        }

        // Authors are compared by name (the natural, unique key) so brand-new authors that do not
        // yet have a database id are still diffed correctly.
        var oldNames = oldAuthors.Select(a => a.Name).ToHashSet(StringComparer.Ordinal);
        var newNames = newAuthors.Select(a => a.Name).ToHashSet(StringComparer.Ordinal);

        foreach (var added in newAuthors.Where(a => !oldNames.Contains(a.Name)).OrderBy(a => a.Name, StringComparer.Ordinal))
        {
            changes.Add(new BookChange
            {
                BookId = bookId,
                Timestamp = timestamp,
                Field = "Authors",
                ChangeType = ChangeType.AuthorAdded,
                OldValue = null,
                NewValue = added.Name,
                Description = ChangeDescriber.AuthorAdded(added.Name)
            });
        }

        foreach (var removed in oldAuthors.Where(a => !newNames.Contains(a.Name)).OrderBy(a => a.Name, StringComparer.Ordinal))
        {
            changes.Add(new BookChange
            {
                BookId = bookId,
                Timestamp = timestamp,
                Field = "Authors",
                ChangeType = ChangeType.AuthorRemoved,
                OldValue = removed.Name,
                NewValue = null,
                Description = ChangeDescriber.AuthorRemoved(removed.Name)
            });
        }

        return changes;
    }
}
