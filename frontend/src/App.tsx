import { useState } from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { BookList } from './components/BookList';
import { BookDialog } from './components/BookDialog';
import { useBooks } from './hooks/useBooks';
import { useDebouncedValue } from './hooks/useAuthorSearch';

interface DialogState {
  mode: 'create' | 'edit';
  bookId: number | null;
}

export default function App() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'title', sort: 'asc' }]);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const sort = sortModel[0];

  const { data, isFetching } = useBooks({
    page: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    sort: sort?.field,
    dir: (sort?.sort as 'asc' | 'desc' | undefined) ?? undefined,
    search: debouncedSearch,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
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
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
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
