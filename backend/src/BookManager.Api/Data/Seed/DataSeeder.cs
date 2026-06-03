using BookManager.Api.Domain;
using BookManager.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BookManager.Api.Data.Seed;

/// <summary>
/// Seeds 200 sample books (with authors and a "Created" change row each) on startup.
/// Idempotent: does nothing if any book already exists. Deterministic via a fixed RNG seed.
/// </summary>
public static class DataSeeder
{
    private const int BookCount = 200;

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Books.AnyAsync(ct)) return;

        var rng = new Random(20240601);

        var authors = AuthorNames.Select(n => new Author { Name = n }).ToList();
        db.Authors.AddRange(authors);
        await db.SaveChangesAsync(ct);

        var usedTitles = new HashSet<string>(StringComparer.Ordinal);
        var books = new List<Book>(BookCount);

        for (var i = 0; i < BookCount; i++)
        {
            var title = BuildTitle(rng, usedTitles);
            var book = new Book
            {
                Title = title,
                ShortDescription = BuildDescription(rng),
                PublishDate = new DateOnly(1950 + rng.Next(0, 75), rng.Next(1, 13), rng.Next(1, 28)),
                BookAuthors = PickAuthors(rng, authors)
                    .Select(a => new BookAuthor { Author = a })
                    .ToList()
            };
            books.Add(book);
        }

        db.Books.AddRange(books);
        await db.SaveChangesAsync(ct);

        // One "Created" change per book, timestamps spread across a year so the history endpoint
        // has data to filter/order/group by date.
        var baseDate = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var changes = books
            .Select(b => BookChangeFactory.CreatedChange(
                b, baseDate.AddDays(rng.Next(0, 365)).AddHours(rng.Next(0, 24)).AddMinutes(rng.Next(0, 60))))
            .ToList();

        db.BookChanges.AddRange(changes);
        await db.SaveChangesAsync(ct);
    }

    private static string BuildTitle(Random rng, HashSet<string> used)
    {
        string title;
        var attempts = 0;
        do
        {
            var pattern = rng.Next(0, 3);
            title = pattern switch
            {
                0 => $"The {Pick(rng, Adjectives)} {Pick(rng, Nouns)}",
                1 => $"{Pick(rng, Nouns)} of {Pick(rng, Places)}",
                _ => $"A {Pick(rng, Adjectives)} {Pick(rng, Nouns)}"
            };
            if (attempts++ > 0 && used.Contains(title))
                title = $"{title}, Vol. {attempts}";
        } while (!used.Add(title));

        return title;
    }

    private static string BuildDescription(Random rng) =>
        $"{Pick(rng, DescOpeners)} {Pick(rng, DescThemes)} {Pick(rng, DescEndings)}";

    private static List<Author> PickAuthors(Random rng, List<Author> pool)
    {
        var count = rng.Next(1, 4);
        return Enumerable.Range(0, count)
            .Select(_ => pool[rng.Next(pool.Count)])
            .Distinct()
            .ToList();
    }

    private static string Pick(Random rng, string[] values) => values[rng.Next(values.Length)];

    private static readonly string[] Adjectives =
    {
        "Silent", "Hidden", "Golden", "Broken", "Distant", "Crimson", "Forgotten", "Endless",
        "Burning", "Frozen", "Wandering", "Hollow", "Radiant", "Shattered", "Whispering"
    };

    private static readonly string[] Nouns =
    {
        "Garden", "Mountain", "River", "Empire", "Shadow", "Lantern", "Compass", "Harvest",
        "Tower", "Mirror", "Voyage", "Covenant", "Machine", "Symphony", "Threshold"
    };

    private static readonly string[] Places =
    {
        "Ashfall", "Verdale", "Northwind", "Marrowford", "Greythorn", "Sunmere", "Blackwater",
        "Highreach", "Westmarch", "Stonehaven"
    };

    private static readonly string[] DescOpeners =
    {
        "A sweeping tale of", "An intimate study of", "A gripping account of",
        "A quiet meditation on", "A bold reimagining of"
    };

    private static readonly string[] DescThemes =
    {
        "love and loss", "ambition and ruin", "memory and time", "war and reconciliation",
        "family and exile", "science and faith"
    };

    private static readonly string[] DescEndings =
    {
        "in a changing world.", "across three generations.", "at the edge of an empire.",
        "on the eve of revolution.", "beneath an indifferent sky."
    };

    private static readonly string[] AuthorNames =
    {
        "Eleanor Hartwell", "Marcus Bellington", "Sofia Castellano", "Theodore Pemberton",
        "Amara Okonkwo", "Henrik Lindqvist", "Priya Raghunathan", "Diego Marquez",
        "Beatrice Sinclair", "Yuki Tanaka", "Olivia Frost", "Nathaniel Crowe",
        "Isadora Vance", "Sebastian Wolfe", "Naomi Abara", "Lucas Thornton",
        "Clara Whitfield", "Mateo Rivas", "Anya Volkova", "Julian Ashford",
        "Genevieve Lark", "Omar Haddad", "Rosalind Mercer", "Felix Underwood",
        "Mira Solberg", "Caleb Ironwood", "Delphine Moreau", "Ravi Chandran",
        "Esther Bloom", "Gideon Vance", "Lila Fontaine", "August Reinholt",
        "Cordelia Sage", "Tobias Renner", "Ingrid Halvorsen", "Samuel Okafor",
        "Vivienne Cross", "Ezra Maddox", "Wren Callahan", "Ophelia Drake",
        "Magnus Eriksen", "Talia Brennan", "Roman Petrov", "Cassia Holloway",
        "Bram Sutherland", "Noor Farah", "Sylvie Aubert", "Dominic Hale",
        "Camille Dubois", "Idris Bello"
    };
}
