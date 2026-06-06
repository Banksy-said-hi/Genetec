using BookManager.Api.Data;
using BookManager.Api.Domain;
using BookManager.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace BookManager.Api.Services;

public class BookService : IBookService
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db;

    public BookService(AppDbContext db) => _db = db;

    public async Task<PagedResult<BookDto>> GetBooksAsync(BookListQuery query, CancellationToken ct)
    {
        var (page, pageSize) = Normalize(query.Page, query.PageSize, 10);

        IQueryable<Book> q = _db.Books.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            // Server-side, case-insensitive search across the title and any author's name.
            q = q.Where(b =>
                EF.Functions.ILike(b.Title, pattern) ||
                b.BookAuthors.Any(ba => EF.Functions.ILike(ba.Author.Name, pattern)));
        }

        var total = await q.CountAsync(ct);

        q = ApplyBookOrdering(q, query.Sort, query.Dir);

        var books = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(b => b.BookAuthors)
            .ThenInclude(ba => ba.Author)
            .ToListAsync(ct);

        return new PagedResult<BookDto>(books.Select(MapBook).ToList(), total, page, pageSize);
    }

    public async Task<BookDto?> GetBookAsync(int id, CancellationToken ct)
    {
        var book = await _db.Books.AsNoTracking()
            .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        return book is null ? null : MapBook(book);
    }

    public async Task<BookDto> CreateBookAsync(BookInput input, CancellationToken ct)
    {
        var timestamp = DateTime.UtcNow;
        var authors = await ResolveAuthorsAsync(input.AuthorNames, ct);

        var book = new Book
        {
            Title = input.Title.Trim(),
            ShortDescription = input.ShortDescription.Trim(),
            PublishDate = input.PublishDate,
            BookAuthors = authors.Select(a => new BookAuthor { Author = a }).ToList()
        };

        // Attach the "Created" row through the navigation so the book and its first change are
        // inserted in a single (transactional) SaveChanges — never a book without its history.
        // EF fixes up BookChange.BookId from the generated Book.Id, so the factory's 0 is irrelevant.
        book.Changes.Add(BookChangeFactory.CreatedChange(book, timestamp));

        _db.Books.Add(book);
        await _db.SaveChangesAsync(ct);

        return (await GetBookAsync(book.Id, ct))!;
    }

    public async Task<BookDto?> UpdateBookAsync(int id, BookInput input, CancellationToken ct)
    {
        var book = await _db.Books
            .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        if (book is null) return null;

        var timestamp = DateTime.UtcNow;

        var oldAuthors = book.BookAuthors.Select(ba => ba.Author).ToList();
        var newAuthors = await ResolveAuthorsAsync(input.AuthorNames, ct);

        var changes = BookChangeFactory.BuildUpdateChanges(
            book.Id,
            book.Title, input.Title.Trim(),
            book.ShortDescription, input.ShortDescription.Trim(),
            book.PublishDate, input.PublishDate,
            oldAuthors, newAuthors,
            timestamp);

        // Apply scalar changes.
        book.Title = input.Title.Trim();
        book.ShortDescription = input.ShortDescription.Trim();
        book.PublishDate = input.PublishDate;

        // Reconcile the join rows to match the new author set (compared by name).
        var newNames = newAuthors.Select(a => a.Name).ToHashSet(StringComparer.Ordinal);
        var existingNames = book.BookAuthors.Select(ba => ba.Author.Name).ToHashSet(StringComparer.Ordinal);

        foreach (var ba in book.BookAuthors.Where(ba => !newNames.Contains(ba.Author.Name)).ToList())
            book.BookAuthors.Remove(ba);

        foreach (var author in newAuthors.Where(a => !existingNames.Contains(a.Name)))
            book.BookAuthors.Add(new BookAuthor { Author = author });

        if (changes.Count > 0)
            _db.BookChanges.AddRange(changes);

        await _db.SaveChangesAsync(ct);

        return (await GetBookAsync(book.Id, ct))!;
    }

    public async Task<PagedResult<BookChangeDto>?> GetChangesAsync(int bookId, ChangesQuery query, CancellationToken ct)
    {
        var bookExists = await _db.Books.AnyAsync(b => b.Id == bookId, ct);
        if (!bookExists) return null;

        var (page, pageSize) = Normalize(query.Page, query.PageSize, 20);

        IQueryable<BookChange> q = _db.BookChanges.AsNoTracking().Where(c => c.BookId == bookId);

        if (!string.IsNullOrWhiteSpace(query.Field))
            q = q.Where(c => c.Field == query.Field);
        if (query.From is not null)
            q = q.Where(c => c.Timestamp >= query.From);
        if (query.To is not null)
            q = q.Where(c => c.Timestamp <= query.To);

        var total = await q.CountAsync(ct);

        var descending = !string.Equals(query.Dir, "asc", StringComparison.OrdinalIgnoreCase);
        q = descending
            ? q.OrderByDescending(c => c.Timestamp).ThenByDescending(c => c.Id)
            : q.OrderBy(c => c.Timestamp).ThenBy(c => c.Id);

        var rows = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PagedResult<BookChangeDto>(rows.Select(MapChange).ToList(), total, page, pageSize);
    }

    public async Task<IReadOnlyList<AuthorDto>> SearchAuthorsAsync(string? search, CancellationToken ct)
    {
        IQueryable<Author> q = _db.Authors.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(a => EF.Functions.ILike(a.Name, $"%{search.Trim()}%"));

        return await q.OrderBy(a => a.Name)
            .Take(20)
            .Select(a => new AuthorDto(a.Id, a.Name))
            .ToListAsync(ct);
    }

    // --- helpers ---

    private async Task<List<Author>> ResolveAuthorsAsync(IReadOnlyList<string> names, CancellationToken ct)
    {
        var clean = names
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (clean.Count == 0) return new List<Author>();

        var existing = await _db.Authors.Where(a => clean.Contains(a.Name)).ToListAsync(ct);
        var byName = existing.ToDictionary(a => a.Name, StringComparer.Ordinal);

        var result = new List<Author>();
        foreach (var name in clean)
        {
            if (byName.TryGetValue(name, out var found))
            {
                result.Add(found);
            }
            else
            {
                var created = new Author { Name = name };
                _db.Authors.Add(created);
                byName[name] = created;
                result.Add(created);
            }
        }
        return result;
    }

    private static IQueryable<Book> ApplyBookOrdering(IQueryable<Book> q, string? sort, string? dir)
    {
        var descending = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);
        return (sort?.ToLowerInvariant()) switch
        {
            "publishdate" => descending
                ? q.OrderByDescending(b => b.PublishDate).ThenBy(b => b.Id)
                : q.OrderBy(b => b.PublishDate).ThenBy(b => b.Id),
            "id" => descending
                ? q.OrderByDescending(b => b.Id)
                : q.OrderBy(b => b.Id),
            _ => descending
                ? q.OrderByDescending(b => b.Title).ThenBy(b => b.Id)
                : q.OrderBy(b => b.Title).ThenBy(b => b.Id),
        };
    }

    private static (int page, int pageSize) Normalize(int page, int pageSize, int defaultPageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = defaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;
        return (page, pageSize);
    }

    private static BookDto MapBook(Book b) => new(
        b.Id,
        b.Title,
        b.ShortDescription,
        b.PublishDate,
        b.BookAuthors
            .Select(ba => new AuthorDto(ba.Author.Id, ba.Author.Name))
            .OrderBy(a => a.Name, StringComparer.Ordinal)
            .ToList());

    private static BookChangeDto MapChange(BookChange c) => new(
        c.Id,
        c.BookId,
        c.Timestamp,
        c.Timestamp.ToString("yyyy-MM-dd"),
        c.Field,
        c.ChangeType.ToString(),
        c.OldValue,
        c.NewValue,
        c.Description);
}
