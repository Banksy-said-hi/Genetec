import type { BookListParams, ChangesParams } from '../api/types';

/** Central query-key factory so mutations can invalidate precisely. */
export const queryKeys = {
  books: (params: BookListParams) => ['books', params] as const,
  book: (id: number) => ['book', id] as const,
  changes: (id: number, params: ChangesParams) => ['changes', id, params] as const,
  authors: (search: string) => ['authors', search] as const,
};
