namespace BookManager.Api.Dtos;

/// <summary>Query parameters for GET /books. All work is done server-side in Postgres.</summary>
public class BookListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    /// <summary>Sort field: "title" | "publishDate" | "id". Defaults to title.</summary>
    public string? Sort { get; set; }
    /// <summary>"asc" | "desc".</summary>
    public string? Dir { get; set; }
    /// <summary>Free-text search over Title and Author name (case-insensitive).</summary>
    public string? Search { get; set; }
}

/// <summary>Query parameters for GET /books/{id}/changes.</summary>
public class ChangesQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    /// <summary>Filter to a single changed field, e.g. "Title".</summary>
    public string? Field { get; set; }
    /// <summary>Inclusive lower bound on the change timestamp (UTC).</summary>
    public DateTime? From { get; set; }
    /// <summary>Inclusive upper bound on the change timestamp (UTC).</summary>
    public DateTime? To { get; set; }
    /// <summary>Order by timestamp: "asc" | "desc". Defaults to desc (newest first).</summary>
    public string? Dir { get; set; }
}
