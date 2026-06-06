import { buildQuery, http } from './client';
import type { Author } from './types';

/** Typed client for the author endpoints (name search backing the autocomplete). */
export const authorsApi = {
  search: (search: string) => http.get<Author[]>(`/authors${buildQuery({ search })}`),
};
