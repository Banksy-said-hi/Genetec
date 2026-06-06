using BookManager.Api.Dtos;

namespace BookManager.Api.Services;

/// <summary>
/// Application service for books, their change history and author lookup. All paging, filtering and
/// ordering is executed server-side; implementations own the diff-and-log behaviour on writes.
/// </summary>
public interface IBookService
{
    /// <summary>Lists books with server-side paging, sorting and free-text search.</summary>
    /// <param name="query">Paging, sort and search parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A page of books with their authors.</returns>
    Task<PagedResult<BookDto>> GetBooksAsync(BookListQuery query, CancellationToken ct);

    /// <summary>Gets a single book by id.</summary>
    /// <param name="id">Book id.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The book, or <c>null</c> if no book has that id.</returns>
    Task<BookDto?> GetBookAsync(int id, CancellationToken ct);

    /// <summary>Creates a book and emits a single "Created" change row.</summary>
    /// <param name="input">Validated create payload.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The created book with its resolved authors.</returns>
    Task<BookDto> CreateBookAsync(BookInput input, CancellationToken ct);

    /// <summary>Updates a book, diffing old against new and emitting one change row per changed field.</summary>
    /// <param name="id">Book id.</param>
    /// <param name="input">Validated update payload.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated book, or <c>null</c> if no book has that id.</returns>
    Task<BookDto?> UpdateBookAsync(int id, BookInput input, CancellationToken ct);

    /// <summary>Gets a book's change history with server-side paging, field/date filtering and ordering.</summary>
    /// <param name="bookId">Book id.</param>
    /// <param name="query">Paging, filter and order parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A page of change rows, or <c>null</c> if no book has that id.</returns>
    Task<PagedResult<BookChangeDto>?> GetChangesAsync(int bookId, ChangesQuery query, CancellationToken ct);

    /// <summary>Searches authors by name to back the autocomplete.</summary>
    /// <param name="search">Optional case-insensitive name fragment.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Up to 20 matching authors, ordered by name.</returns>
    Task<IReadOnlyList<AuthorDto>> SearchAuthorsAsync(string? search, CancellationToken ct);
}
