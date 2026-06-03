using BookManager.Api.Services;

namespace BookManager.Tests;

public class ChangeDescriberTests
{
    [Fact]
    public void Created_produces_expected_sentence()
        => Assert.Equal("Book \"The Hobbit\" was created", ChangeDescriber.Created("The Hobbit"));

    [Fact]
    public void TitleChanged_produces_expected_sentence()
        => Assert.Equal("Title was changed to \"The Hobbit\"", ChangeDescriber.TitleChanged("The Hobbit"));

    [Fact]
    public void PublishDateChanged_formats_iso_date()
        => Assert.Equal("Publish date was changed to 2001-03-15",
            ChangeDescriber.PublishDateChanged(new DateOnly(2001, 3, 15)));

    [Fact]
    public void AuthorAdded_and_removed_produce_expected_sentences()
    {
        Assert.Equal("Author \"J.R.R. Tolkien\" was added", ChangeDescriber.AuthorAdded("J.R.R. Tolkien"));
        Assert.Equal("Author \"J.R.R. Tolkien\" was removed", ChangeDescriber.AuthorRemoved("J.R.R. Tolkien"));
    }

    [Fact]
    public void ShortDescriptionChanged_includes_short_value_verbatim()
        => Assert.Equal("Short description was changed to \"A short blurb.\"",
            ChangeDescriber.ShortDescriptionChanged("A short blurb."));

    [Fact]
    public void ShortDescriptionChanged_truncates_long_value()
    {
        var longText = new string('x', 100);
        var result = ChangeDescriber.ShortDescriptionChanged(longText);
        Assert.Equal($"Short description was changed to \"{new string('x', 60)}…\"", result);
    }
}
