import { buildQuery, http } from './client';
import type { Author } from './types';

export const authorsApi = {
  search: (search: string) => http.get<Author[]>(`/authors${buildQuery({ search })}`),
};
