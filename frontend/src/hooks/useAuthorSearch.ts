import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authorsApi } from '../api/authors';
import { queryKeys } from './keys';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

/** Debounced author search backing the autocomplete. */
export function useAuthorSearch(term: string, delayMs = 300) {
  const debounced = useDebouncedValue(term.trim(), delayMs);
  return useQuery({
    queryKey: queryKeys.authors(debounced),
    queryFn: () => authorsApi.search(debounced),
  });
}
