/**
 * JSON helper for **client** TanStack Query `queryFn`s.
 * Web `fetch` only — not Next’s server `fetch`. See `docs/data.md`.
 * Throws on HTTP error (Query expects that):
 * https://tanstack.com/query/latest/docs/framework/react/guides/query-functions
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
