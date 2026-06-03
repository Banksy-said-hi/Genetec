import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { Book } from '../api/types';

interface BookCardProps {
  book: Book;
}

/** Presentational card showing a book's current state. Re-renders when the book query refreshes. */
export function BookCard({ book }: BookCardProps) {
  return (
    <Card variant="outlined" data-testid="book-card">
      <CardContent>
        <Typography variant="h5" gutterBottom data-testid="book-card-title">
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Published {book.publishDate}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }} data-testid="book-card-description">
          {book.shortDescription}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {book.authors.map((author) => (
              <Chip key={author.id} label={author.name} size="small" />
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
