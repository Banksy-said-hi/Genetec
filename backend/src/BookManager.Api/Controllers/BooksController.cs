using BookManager.Api.Dtos;
using BookManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookManager.Api.Controllers;

[ApiController]
[Route("books")]
public class BooksController : ControllerBase
{
    private readonly IBookService _service;

    public BooksController(IBookService service) => _service = service;

    /// <summary>List books with server-side paging, sorting and free-text search.</summary>
    [HttpGet]
    public Task<PagedResult<BookDto>> GetBooks([FromQuery] BookListQuery query, CancellationToken ct)
        => _service.GetBooksAsync(query, ct);

    /// <summary>Get a single book by id.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookDto>> GetBook(int id, CancellationToken ct)
    {
        var book = await _service.GetBookAsync(id, ct);
        return book is null ? NotFound() : Ok(book);
    }

    /// <summary>Create a book. Emits a single "Created" change row.</summary>
    [HttpPost]
    public async Task<ActionResult<BookDto>> CreateBook([FromBody] BookInput input, CancellationToken ct)
    {
        var book = await _service.CreateBookAsync(input, ct);
        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
    }

    /// <summary>Update a book. Diffs old vs new and emits one change row per changed field.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<BookDto>> UpdateBook(int id, [FromBody] BookInput input, CancellationToken ct)
    {
        var book = await _service.UpdateBookAsync(id, input, ct);
        return book is null ? NotFound() : Ok(book);
    }

    /// <summary>Get a book's change history with server-side paging, field/date filtering and ordering.</summary>
    [HttpGet("{id:int}/changes")]
    public async Task<ActionResult<PagedResult<BookChangeDto>>> GetChanges(int id, [FromQuery] ChangesQuery query, CancellationToken ct)
    {
        var result = await _service.GetChangesAsync(id, query, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
