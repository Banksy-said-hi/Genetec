namespace BookManager.Api.Dtos;

/// <summary>Standard server-side pagination envelope returned by all list endpoints.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
