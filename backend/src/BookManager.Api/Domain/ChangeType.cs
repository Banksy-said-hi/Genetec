namespace BookManager.Api.Domain;

/// <summary>
/// The kind of change recorded in a <see cref="BookChange"/> row.
/// </summary>
public enum ChangeType
{
    Created,
    Updated,
    AuthorAdded,
    AuthorRemoved
}
