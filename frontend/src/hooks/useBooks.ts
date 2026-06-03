import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '../api/books';
import type { BookInput, BookListParams, ChangesParams } from '../api/types';
import { queryKeys } from './keys';

export function useBooks(params: BookListParams) {
  return useQuery({
    queryKey: queryKeys.books(params),
    queryFn: () => booksApi.list(params),
  });
}

export function useBook(id: number | null) {
  return useQuery({
    queryKey: queryKeys.book(id ?? 0),
    queryFn: () => booksApi.get(id as number),
    enabled: id !== null,
  });
}

export function useBookChanges(id: number | null, params: ChangesParams) {
  return useQuery({
    queryKey: queryKeys.changes(id ?? 0, params),
    queryFn: () => booksApi.changes(id as number, params),
    enabled: id !== null,
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInput) => booksApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInput) => booksApi.update(id, input),
    onSuccess: () => {
      // Refresh the list, the single book card and its change history.
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['book', id] });
      qc.invalidateQueries({ queryKey: ['changes', id] });
    },
  });
}
