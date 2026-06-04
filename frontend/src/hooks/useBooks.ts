import { useEffect } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { booksApi } from '../api/books';
import type { BookInput, BookListParams, ChangesParams } from '../api/types';
import { queryKeys } from './keys';

const BOOKS_STALE_TIME = 30_000;

export function useBooks(params: BookListParams) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.books(params),
    queryFn: () => booksApi.list(params),
    // Keep the current page visible while the next one loads (no blank flicker on page turn).
    placeholderData: keepPreviousData,
    staleTime: BOOKS_STALE_TIME,
  });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.totalCount / params.pageSize))
    : undefined;

  // Prefetch the adjacent pages so paging forward/back is served from cache instantly.
  useEffect(() => {
    const prefetchPage = (page: number) => {
      if (page < 1 || (totalPages !== undefined && page > totalPages)) return;
      const neighbor = { ...params, page };
      qc.prefetchQuery({
        queryKey: queryKeys.books(neighbor),
        queryFn: () => booksApi.list(neighbor),
        staleTime: BOOKS_STALE_TIME,
      });
    };
    prefetchPage(params.page + 1);
    prefetchPage(params.page - 1);
    // Re-run only when the actual query inputs change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, params.page, params.pageSize, params.sort, params.dir, params.search, totalPages]);

  return query;
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
