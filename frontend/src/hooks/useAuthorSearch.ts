import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authorsApi } from '../api/authors';
import { queryKeys } from './keys';

/**
 * Returns a debounced copy of a value that only updates after it has been stable for `delayMs`.
 *
 * @param value - The value to debounce.
 * @param delayMs - Quiet period in milliseconds before the debounced value updates.
 * @returns The latest value, delayed until input settles.
 */
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
