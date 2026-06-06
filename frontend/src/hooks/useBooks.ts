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

/**
 * Fetches a page of books and prefetches the adjacent pages so paging is served from cache.
 *
 * @param params - Paging, sort and search parameters.
 * @returns The React Query result for the book page.
 */
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

/**
 * Fetches a single book; disabled while `id` is null.
 *
 * @param id - Book id, or null to skip the query.
 * @returns The React Query result for the book.
 */
export function useBook(id: number | null) {
  return useQuery({
    queryKey: queryKeys.book(id ?? 0),
    queryFn: () => booksApi.get(id as number),
    enabled: id !== null,
  });
}

/**
 * Fetches a page of a book's change history; disabled while `id` is null.
 *
 * @param id - Book id, or null to skip the query.
 * @param params - Paging, filter and order parameters.
 * @returns The React Query result for the change-history page.
 */
export function useBookChanges(id: number | null, params: ChangesParams) {
  return useQuery({
    queryKey: queryKeys.changes(id ?? 0, params),
    queryFn: () => booksApi.changes(id as number, params),
    enabled: id !== null,
  });
}

/**
 * Mutation that creates a book and invalidates the book list on success.
 *
 * @returns The React Query mutation.
 */
export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInput) => booksApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

/**
 * Mutation that updates a book and invalidates the list, the book and its change history on success.
 *
 * @param id - Book id to update.
 * @returns The React Query mutation.
 */
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
