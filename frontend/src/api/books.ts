import { buildQuery, http } from './client';
import type {
  Book,
  BookChange,
  BookInput,
  BookListParams,
  ChangesParams,
  PagedResult,
} from './types';

export const booksApi = {
  list: (params: BookListParams) =>
    http.get<PagedResult<Book>>(`/books${buildQuery({ ...params })}`),

  get: (id: number) => http.get<Book>(`/books/${id}`),

  create: (input: BookInput) => http.post<Book>('/books', input),

  update: (id: number, input: BookInput) => http.put<Book>(`/books/${id}`, input),

  changes: (id: number, params: ChangesParams) =>
    http.get<PagedResult<BookChange>>(`/books/${id}/changes${buildQuery({ ...params })}`),
};
