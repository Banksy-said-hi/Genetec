import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
} from '@mui/material';
import type { BookInput, DialogMode } from '../api/types';
import { useBook, useBookChanges, useCreateBook, useUpdateBook } from '../hooks/useBooks';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { BookCard } from './BookCard';
import { ChangeHistory } from './ChangeHistory';

interface BookDialogProps {
  open: boolean;
  mode: DialogMode;
  bookId: number | null;
  onClose: () => void;
}

// Show up to 10 changes per page; the pager only appears when a book has more than 10.
const CHANGES_PAGE_SIZE = 10;

// Field limits mirror the server-side bounds on BookInput so the UI can't exceed them.
const TITLE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 2000;
const emptyForm: BookInput = { title: '', shortDescription: '', publishDate: '', authorNames: [] };

/**
 * Create/edit dialog for a book. In edit mode it also shows the book card and its paged change
 * history. Enforces the server's input bounds in the UI and surfaces save failures inline.
 */
export function BookDialog({ open, mode, bookId, onClose }: BookDialogProps) {
  const isEdit = mode === 'edit' && bookId !== null;

  const [form, setForm] = useState<BookInput>(emptyForm);
  const [changesPage, setChangesPage] = useState(1);
  // Records which source (create, or a specific book) the form was last initialised from.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  const { data: book, isLoading: bookLoading } = useBook(isEdit ? bookId : null);
  const { data: changes, isLoading: changesLoading } = useBookChanges(isEdit ? bookId : null, {
    page: changesPage,
    pageSize: CHANGES_PAGE_SIZE,
    dir: 'desc',
  });

  const createBook = useCreateBook();
  const updateBook = useUpdateBook(bookId ?? 0);
  const saving = createBook.isPending || updateBook.isPending;
  const saveError = createBook.error ?? updateBook.error;

  // Initialise the form when the dialog opens or switches books. Done during render (React's
  // "adjust state during render" pattern) rather than in an effect, so opening the dialog doesn't
  // trigger a cascading setState-in-effect. The guards keep it from looping.
  const formSource = !open
    ? null
    : mode === 'create'
      ? 'create'
      : book
        ? `edit:${book.id}`
        : null; // edit mode, book not loaded yet — wait

  if (!open) {
    // Forget the last sync once closed so reopening always re-initialises the form.
    if (syncedFor !== null) setSyncedFor(null);
  } else if (formSource !== null && formSource !== syncedFor) {
    setSyncedFor(formSource);
    setChangesPage(1);
    setForm(
      book
        ? {
            title: book.title,
            shortDescription: book.shortDescription,
            publishDate: book.publishDate,
            authorNames: book.authors.map((a) => a.name),
          }
        : emptyForm,
    );
  }

  // Clear any prior save error on close so a stale failure doesn't carry into the next open.
  const handleClose = () => {
    createBook.reset();
    updateBook.reset();
    onClose();
  };

  const pageCount = changes ? Math.max(1, Math.ceil(changes.totalCount / CHANGES_PAGE_SIZE)) : 1;
  const valid = form.title.trim() !== '' && form.shortDescription.trim() !== '' && form.publishDate !== '';

  const update = (patch: Partial<BookInput>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    if (!valid) return;
    if (mode === 'create') {
      createBook.mutate(form, { onSuccess: () => onClose() });
    } else if (bookId !== null) {
      updateBook.mutate(form, { onSuccess: () => onClose() });
    }
  };

  const title = useMemo(() => (mode === 'create' ? 'Add book' : 'Edit book'), [mode]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {saveError ? (
            <Alert severity="error" data-testid="save-error">
              {saveError instanceof Error ? saveError.message : 'Failed to save the book.'}
            </Alert>
          ) : null}
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            required
            fullWidth
            slotProps={{ htmlInput: { 'data-testid': 'book-title-input', maxLength: TITLE_MAX_LENGTH } }}
          />
          <TextField
            label="Short description"
            value={form.shortDescription}
            onChange={(e) => update({ shortDescription: e.target.value })}
            required
            fullWidth
            multiline
            minRows={2}
            slotProps={{
              htmlInput: { 'data-testid': 'book-description-input', maxLength: DESCRIPTION_MAX_LENGTH },
            }}
          />
          <TextField
            label="Publish date"
            type="date"
            value={form.publishDate}
            onChange={(e) => update({ publishDate: e.target.value })}
            required
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { 'data-testid': 'book-date-input' },
            }}
          />
          <AuthorAutocomplete
            value={form.authorNames}
            onChange={(authorNames) => update({ authorNames })}
          />

          {isEdit && (
            <>
              <Divider />
              <Box>
                {book && !bookLoading ? <BookCard book={book} /> : null}
              </Box>
              <Divider />
              <ChangeHistory
                changes={changes?.items ?? []}
                loading={changesLoading}
                page={changesPage}
                pageCount={pageCount}
                onPageChange={setChangesPage}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} data-testid="dialog-cancel">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!valid || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          data-testid="book-save"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
