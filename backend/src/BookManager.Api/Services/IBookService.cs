using BookManager.Api.Dtos;

namespace BookManager.Api.Services;

public interface IBookService
{
    Task<PagedResult<BookDto>> GetBooksAsync(BookListQuery query, CancellationToken ct);
    Task<BookDto?> GetBookAsync(int id, CancellationToken ct);
    Task<BookDto> CreateBookAsync(BookInput input, CancellationToken ct);
    Task<BookDto?> UpdateBookAsync(int id, BookInput input, CancellationToken ct);
    Task<PagedResult<BookChangeDto>?> GetChangesAsync(int bookId, ChangesQuery query, CancellationToken ct);
    Task<IReadOnlyList<AuthorDto>> SearchAuthorsAsync(string? search, CancellationToken ct);
}
