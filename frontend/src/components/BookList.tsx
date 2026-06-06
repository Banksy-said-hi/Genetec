import {
  Box,
  Pagination,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import type { Book, SortDir } from '../api/types';

interface BookListProps {
  rows: Book[];
  rowCount: number;
  loading: boolean;
  page: number; // 1-indexed
  pageSize: number;
  onPageChange: (page: number) => void;
  sortField: string;
  sortDir: SortDir;
  onSortChange: (field: string, dir: SortDir) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRowClick: (id: number) => void;
}

// Only Title and Published are server-sortable (BookService.ApplyBookOrdering knows
// "title" | "publishdate" | "id"); Description and Authors render unsorted.
const SORTABLE_COLUMNS = new Set(['title', 'publishDate']);

/**
 * Presentational, fully controlled book table. All paging/sorting/filtering is delegated upward
 * (server-side); this component only renders rows and reports user intent through callbacks.
 */
export function BookList({
  rows,
  rowCount,
  loading,
  page,
  pageSize,
  onPageChange,
  sortField,
  sortDir,
  onSortChange,
  search,
  onSearchChange,
  onRowClick,
}: BookListProps) {
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));

  const handleSort = (field: string) => {
    if (!SORTABLE_COLUMNS.has(field)) return;
    // Same column → flip direction; new column → start ascending.
    onSortChange(field, sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
  };

  const sortLabel = (field: string, label: string) => (
    <TableSortLabel
      active={sortField === field}
      direction={sortField === field ? sortDir : 'asc'}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <Box>
      <TextField
        label="Search by title or author"
        variant="outlined"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{ htmlInput: { 'data-testid': 'book-search' } }}
      />

      <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortField === 'title' ? sortDir : false}>
                {sortLabel('title', 'Title')}
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell sortDirection={sortField === 'publishDate' ? sortDir : false}>
                {sortLabel('publishDate', 'Published')}
              </TableCell>
              <TableCell>Authors</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: pageSize }).map((_, rowIndex) => (
                  <TableRow key={rowIndex} data-testid="book-row-skeleton">
                    {Array.from({ length: 4 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((bookRow) => (
                  <TableRow
                    key={bookRow.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    data-testid="book-row"
                    onClick={() => onRowClick(bookRow.id)}
                  >
                    <TableCell>{bookRow.title}</TableCell>
                    <TableCell>{bookRow.shortDescription}</TableCell>
                    <TableCell>{bookRow.publishDate}</TableCell>
                    <TableCell>{bookRow.authors.map((a) => a.name).join(', ')}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!loading && rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No books found.
          </Typography>
        ) : null}
      </Box>

      {pageCount > 1 ? (
        <Stack sx={{ mt: 2, alignItems: 'center' }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            size="small"
          />
        </Stack>
      ) : null}
    </Box>
  );
}
