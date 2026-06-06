import { useState } from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BookList } from './components/BookList';
import { BookDialog } from './components/BookDialog';
import { useBooks } from './hooks/useBooks';
import { useDebouncedValue } from './hooks/useAuthorSearch';
import type { DialogMode, SortDir } from './api/types';

interface DialogState {
  mode: DialogMode;
  bookId: number | null;
}

const PAGE_SIZE = 20;

export default function App() {
  const [page, setPage] = useState(1); // 1-indexed, matching the API and MUI Pagination
  const [sortField, setSortField] = useState('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isFetching } = useBooks({
    page,
    pageSize: PAGE_SIZE,
    sort: sortField,
    dir: sortDir,
    search: debouncedSearch,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (field: string, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
    setPage(1);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Book Manager
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setDialog({ mode: 'create', bookId: null })}
            data-testid="add-book"
          >
            Add book
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <BookList
          rows={data?.items ?? []}
          rowCount={data?.totalCount ?? 0}
          loading={isFetching}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortField={sortField}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          search={search}
          onSearchChange={handleSearchChange}
          onRowClick={(id) => setDialog({ mode: 'edit', bookId: id })}
        />
      </Container>

      <BookDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'create'}
        bookId={dialog?.bookId ?? null}
        onClose={() => setDialog(null)}
      />
    </Box>
  );
}
