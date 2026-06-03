namespace BookManager.Api.Services;

/// <summary>
/// Produces the human-readable sentence stored on each change row. Pure and deterministic so the
/// exact wording can be unit-tested (e.g. <c>Title was changed to "The Hobbit"</c>).
/// </summary>
public static class ChangeDescriber
{
    private const int MaxValueLength = 60;

    public static string Created(string title) => $"Book \"{title}\" was created";

    public static string TitleChanged(string newTitle) => $"Title was changed to \"{newTitle}\"";

    public static string ShortDescriptionChanged(string newDescription) =>
        $"Short description was changed to \"{Truncate(newDescription)}\"";

    public static string PublishDateChanged(DateOnly newDate) =>
        $"Publish date was changed to {newDate:yyyy-MM-dd}";

    public static string AuthorAdded(string name) => $"Author \"{name}\" was added";

    public static string AuthorRemoved(string name) => $"Author \"{name}\" was removed";

    private static string Truncate(string value) =>
        value.Length <= MaxValueLength ? value : value[..MaxValueLength] + "…";
}
