/**
 * Small JSON helper for **client** TanStack Query `queryFn`s (e.g. card modal).
 *
 * Uses the **Web** [`fetch`](https://developer.mozilla.org/docs/Web/API/fetch) API
 * (browser / client bundle). That is **not** the same as Next.js’s
 * [extended server `fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch)
 * (`cache` / `next.revalidate` / `next.tags`) — those options apply in Server
 * Components and other server code, not here.
 *
 * Prefer this over adding Axios unless we need interceptors or non-JSON APIs.
 * TanStack Query requires thrown errors on failure — native `fetch` does not
 * reject on HTTP 4xx/5xx by itself:
 * https://tanstack.com/query/latest/docs/framework/react/guides/query-functions
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
