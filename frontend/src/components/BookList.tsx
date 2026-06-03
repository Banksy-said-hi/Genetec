import { Box, TextField } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowParams,
  type GridSortModel,
} from '@mui/x-data-grid';
import type { Book } from '../api/types';

interface BookListProps {
  rows: Book[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRowClick: (id: number) => void;
}

const columns: GridColDef<Book>[] = [
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 180 },
  {
    field: 'shortDescription',
    headerName: 'Description',
    flex: 2,
    minWidth: 240,
    sortable: false,
  },
  { field: 'publishDate', headerName: 'Published', width: 130 },
  {
    field: 'authors',
    headerName: 'Authors',
    flex: 1,
    minWidth: 180,
    sortable: false,
    valueGetter: (_value, row) => row.authors.map((a) => a.name).join(', '),
  },
];

/**
 * Presentational, fully controlled book grid. All paging/sorting/filtering is delegated upward
 * (server-side); this component only renders rows and reports user intent through callbacks.
 */
export function BookList({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  search,
  onSearchChange,
  onRowClick,
}: BookListProps) {
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
      <Box sx={{ height: 640, width: '100%', bgcolor: 'background.paper' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={onSortModelChange}
          pageSizeOptions={[10]}
          disableColumnFilter
          disableRowSelectionOnClick
          onRowClick={(params: GridRowParams<Book>) => onRowClick(params.row.id)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          slotProps={{
            loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
          }}
        />
      </Box>
    </Box>
  );
}
