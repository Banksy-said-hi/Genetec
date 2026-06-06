/** Sort direction shared by list/query params and the book-list sort controls. */
export type SortDir = 'asc' | 'desc';

/** Mode of the book create/edit dialog. */
export type DialogMode = 'create' | 'edit';

export interface Author {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  shortDescription: string;
  publishDate: string; // yyyy-MM-dd
  authors: Author[];
}

export interface BookChange {
  id: number;
  bookId: number;
  timestamp: string;
  date: string; // yyyy-MM-dd, precomputed server-side for grouping
  field: string;
  changeType: 'Created' | 'Updated' | 'AuthorAdded' | 'AuthorRemoved';
  oldValue: string | null;
  newValue: string | null;
  description: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BookInput {
  title: string;
  shortDescription: string;
  publishDate: string;
  authorNames: string[];
}

export interface BookListParams {
  page: number;
  pageSize: number;
  sort?: string;
  dir?: SortDir;
  search?: string;
}

export interface ChangesParams {
  page?: number;
  pageSize?: number;
  field?: string;
  from?: string;
  to?: string;
  dir?: SortDir;
}
