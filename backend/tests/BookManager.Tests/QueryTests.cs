using BookManager.Api.Data;
using BookManager.Api.Domain;
using BookManager.Api.Dtos;
using BookManager.Api.Services;
using BookManager.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace BookManager.Tests;

[Collection("postgres")]
public class QueryTests : IAsyncLifetime
{
    private readonly PostgresFixture _fixture;
    private AppDbContext _db = null!;
    private BookService _service = null!;

    public QueryTests(PostgresFixture fixture) => _fixture = fixture;

    public async Task InitializeAsync()
    {
        _db = _fixture.CreateContext();
        // Isolate each test: wipe all data before seeding.
        await _db.Database.ExecuteSqlRawAsync(
            "TRUNCATE \"BookChanges\", \"BookAuthors\", \"Books\", \"Authors\" RESTART IDENTITY CASCADE;");
        _service = new BookService(_db);
    }

    public async Task DisposeAsync() => await _db.DisposeAsync();

    // ---------- list query ----------

    [Fact]
    public async Task GetBooks_paginates_server_side()
    {
        await SeedBooksAsync(Enumerable.Range(1, 25).Select(i => $"Book {i:00}").ToArray());

        var result = await _service.GetBooksAsync(new BookListQuery { Page = 2, PageSize = 10 }, default);

        Assert.Equal(25, result.TotalCount);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(2, result.Page);
        // Default sort is title asc, so page 2 starts at "Book 11".
        Assert.Equal("Book 11", result.Items.First().Title);
    }

    [Fact]
    public async Task GetBooks_filters_by_title_case_insensitively()
    {
        await SeedBooksAsync("The Hobbit", "War and Peace", "Hobbit Habits");

        var result = await _service.GetBooksAsync(new BookListQuery { Search = "hobbit" }, default);

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, b => Assert.Contains("Hobbit", b.Title, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetBooks_filters_by_author_name()
    {
        await SeedBookWithAuthorsAsync("Alpha", "Tolkien");
        await SeedBookWithAuthorsAsync("Beta", "Rowling");

        var result = await _service.GetBooksAsync(new BookListQuery { Search = "tolkien" }, default);

        var book = Assert.Single(result.Items);
        Assert.Equal("Alpha", book.Title);
    }

    [Fact]
    public async Task GetBooks_orders_by_title_descending()
    {
        await SeedBooksAsync("Alpha", "Charlie", "Bravo");

        var result = await _service.GetBooksAsync(new BookListQuery { Sort = "title", Dir = "desc" }, default);

        Assert.Equal(new[] { "Charlie", "Bravo", "Alpha" }, result.Items.Select(b => b.Title));
    }

    [Fact]
    public async Task GetBooks_orders_by_publish_date_ascending()
    {
        await SeedBookAsync("Newest", new DateOnly(2020, 1, 1));
        await SeedBookAsync("Oldest", new DateOnly(1990, 1, 1));
        await SeedBookAsync("Middle", new DateOnly(2005, 1, 1));

        var result = await _service.GetBooksAsync(new BookListQuery { Sort = "publishDate", Dir = "asc" }, default);

        Assert.Equal(new[] { "Oldest", "Middle", "Newest" }, result.Items.Select(b => b.Title));
    }

    // ---------- changes query ----------

    [Fact]
    public async Task GetChanges_filters_by_field_and_orders_by_time()
    {
        var bookId = await SeedBookAsync("Subject", new DateOnly(2020, 1, 1));
        await SeedChangesAsync(bookId,
            ("Title", new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            ("Title", new DateTime(2024, 1, 3, 0, 0, 0, DateTimeKind.Utc)),
            ("ShortDescription", new DateTime(2024, 1, 2, 0, 0, 0, DateTimeKind.Utc)));

        var result = await _service.GetChangesAsync(bookId,
            new ChangesQuery { Field = "Title", Dir = "asc" }, default);

        Assert.NotNull(result);
        Assert.Equal(2, result!.TotalCount);
        Assert.All(result.Items, c => Assert.Equal("Title", c.Field));
        Assert.True(result.Items[0].Timestamp < result.Items[1].Timestamp);
    }

    [Fact]
    public async Task GetChanges_filters_by_date_range()
    {
        var bookId = await SeedBookAsync("Subject", new DateOnly(2020, 1, 1));
        await SeedChangesAsync(bookId,
            ("Title", new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            ("Title", new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc)),
            ("Title", new DateTime(2024, 12, 1, 0, 0, 0, DateTimeKind.Utc)));

        var result = await _service.GetChangesAsync(bookId, new ChangesQuery
        {
            From = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            To = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc)
        }, default);

        Assert.NotNull(result);
        var change = Assert.Single(result!.Items);
        Assert.Equal(new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc), change.Timestamp);
    }

    [Fact]
    public async Task GetChanges_defaults_to_newest_first_and_paginates()
    {
        var bookId = await SeedBookAsync("Subject", new DateOnly(2020, 1, 1));
        await SeedChangesAsync(bookId, Enumerable.Range(1, 5)
            .Select(i => ("Title", new DateTime(2024, 1, i, 0, 0, 0, DateTimeKind.Utc)))
            .ToArray());

        var result = await _service.GetChangesAsync(bookId, new ChangesQuery { Page = 1, PageSize = 2 }, default);

        Assert.NotNull(result);
        Assert.Equal(5, result!.TotalCount);
        Assert.Equal(2, result.Items.Count);
        // Newest first.
        Assert.Equal(new DateTime(2024, 1, 5, 0, 0, 0, DateTimeKind.Utc), result.Items[0].Timestamp);
    }

    [Fact]
    public async Task GetChanges_returns_null_for_unknown_book()
    {
        var result = await _service.GetChangesAsync(99999, new ChangesQuery(), default);
        Assert.Null(result);
    }

    [Fact]
    public async Task ChangeDto_exposes_grouping_date()
    {
        var bookId = await SeedBookAsync("Subject", new DateOnly(2020, 1, 1));
        await SeedChangesAsync(bookId, ("Title", new DateTime(2024, 3, 9, 14, 30, 0, DateTimeKind.Utc)));

        var result = await _service.GetChangesAsync(bookId, new ChangesQuery(), default);

        var change = Assert.Single(result!.Items);
        Assert.Equal("2024-03-09", change.Date);
    }

    // ---------- seeding helpers ----------

    private async Task SeedBooksAsync(params string[] titles)
    {
        foreach (var title in titles)
            await SeedBookAsync(title, new DateOnly(2000, 1, 1));
    }

    private async Task<int> SeedBookAsync(string title, DateOnly publishDate)
    {
        var book = new Book { Title = title, ShortDescription = "desc", PublishDate = publishDate };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        return book.Id;
    }

    private async Task SeedBookWithAuthorsAsync(string title, params string[] authorNames)
    {
        var book = new Book
        {
            Title = title,
            ShortDescription = "desc",
            PublishDate = new DateOnly(2000, 1, 1),
            BookAuthors = authorNames.Select(n => new BookAuthor { Author = new Author { Name = n } }).ToList()
        };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
    }

    private async Task SeedChangesAsync(int bookId, params (string Field, DateTime Timestamp)[] changes)
    {
        foreach (var (field, ts) in changes)
        {
            _db.BookChanges.Add(new BookChange
            {
                BookId = bookId,
                Field = field,
                ChangeType = ChangeType.Updated,
                Timestamp = ts,
                NewValue = "v",
                Description = $"{field} changed"
            });
        }
        await _db.SaveChangesAsync();
    }
}

[CollectionDefinition("postgres")]
public class PostgresCollection : ICollectionFixture<PostgresFixture> { }
