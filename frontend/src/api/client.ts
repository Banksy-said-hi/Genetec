export const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5021';

type QueryValue = string | number | boolean | null | undefined;

/** Builds a query string, dropping null/undefined/empty values. */
export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    // Surface a status-based generic message; never echo the raw response body, which can
    // contain server internals. (Future: parse ProblemDetails for field-level detail — see README.)
    const message =
      response.status >= 500
        ? 'Something went wrong. Please try again.'
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
};
