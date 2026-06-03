using BookManager.Api.Dtos;
using BookManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookManager.Api.Controllers;

[ApiController]
[Route("authors")]
public class AuthorsController : ControllerBase
{
    private readonly IBookService _service;

    public AuthorsController(IBookService service) => _service = service;

    /// <summary>Search authors by name (backs the autocomplete). Returns up to 20 matches.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<AuthorDto>> SearchAuthors([FromQuery] string? search, CancellationToken ct)
        => await _service.SearchAuthorsAsync(search, ct);
}
