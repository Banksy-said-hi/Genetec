import { useEffect, useMemo, useState } from 'react';
import {
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
import type { BookInput } from '../api/types';
import { useBook, useBookChanges, useCreateBook, useUpdateBook } from '../hooks/useBooks';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { BookCard } from './BookCard';
import { ChangeHistory } from './ChangeHistory';

interface BookDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  bookId: number | null;
  onClose: () => void;
}

const CHANGES_PAGE_SIZE = 5;
const emptyForm: BookInput = { title: '', shortDescription: '', publishDate: '', authorNames: [] };

export function BookDialog({ open, mode, bookId, onClose }: BookDialogProps) {
  const isEdit = mode === 'edit' && bookId !== null;

  const [form, setForm] = useState<BookInput>(emptyForm);
  const [changesPage, setChangesPage] = useState(1);

  const { data: book, isLoading: bookLoading } = useBook(isEdit ? bookId : null);
  const { data: changes, isLoading: changesLoading } = useBookChanges(isEdit ? bookId : null, {
    page: changesPage,
    pageSize: CHANGES_PAGE_SIZE,
    dir: 'desc',
  });

  const createBook = useCreateBook();
  const updateBook = useUpdateBook(bookId ?? 0);
  const saving = createBook.isPending || updateBook.isPending;

  // Populate the form whenever the dialog opens (from the loaded book in edit mode, blank in create).
  useEffect(() => {
    if (!open) return;
    setChangesPage(1);
    if (isEdit && book) {
      setForm({
        title: book.title,
        shortDescription: book.shortDescription,
        publishDate: book.publishDate,
        authorNames: book.authors.map((a) => a.name),
      });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
  }, [open, isEdit, book, mode]);

  const pageCount = changes ? Math.max(1, Math.ceil(changes.totalCount / CHANGES_PAGE_SIZE)) : 1;
  const valid = form.title.trim() !== '' && form.shortDescription.trim() !== '' && form.publishDate !== '';

  const update = (patch: Partial<BookInput>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    if (!valid) return;
    if (mode === 'create') {
      createBook.mutate(form, { onSuccess: () => onClose() });
    } else if (bookId !== null) {
      updateBook.mutate(form);
    }
  };

  const title = useMemo(() => (mode === 'create' ? 'Add book' : 'Edit book'), [mode]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            required
            fullWidth
            slotProps={{ htmlInput: { 'data-testid': 'book-title-input' } }}
          />
          <TextField
            label="Short description"
            value={form.shortDescription}
            onChange={(e) => update({ shortDescription: e.target.value })}
            required
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { 'data-testid': 'book-description-input' } }}
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
        <Button onClick={onClose} data-testid="dialog-cancel">
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
