using BookManager.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BookManager.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<BookAuthor> BookAuthors => Set<BookAuthor>();
    public DbSet<BookChange> BookChanges => Set<BookChange>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Book>(e =>
        {
            e.Property(x => x.Title).IsRequired().HasMaxLength(500);
            e.Property(x => x.ShortDescription).IsRequired().HasMaxLength(2000);
            e.HasIndex(x => x.Title);
        });

        b.Entity<Author>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(300);
            // Indexed for the autocomplete search; unique so authors resolve by name without dupes.
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<BookAuthor>(e =>
        {
            e.HasKey(x => new { x.BookId, x.AuthorId });
            e.HasOne(x => x.Book)
                .WithMany(x => x.BookAuthors)
                .HasForeignKey(x => x.BookId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Author)
                .WithMany(x => x.BookAuthors)
                .HasForeignKey(x => x.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<BookChange>(e =>
        {
            e.Property(x => x.Field).IsRequired().HasMaxLength(100);
            e.Property(x => x.Description).IsRequired().HasMaxLength(1000);
            e.Property(x => x.ChangeType).HasConversion<string>().HasMaxLength(50);
            e.HasOne(x => x.Book)
                .WithMany(x => x.Changes)
                .HasForeignKey(x => x.BookId)
                .OnDelete(DeleteBehavior.Cascade);
            // History is always queried per book, ordered by time.
            e.HasIndex(x => new { x.BookId, x.Timestamp });
        });
    }
}
