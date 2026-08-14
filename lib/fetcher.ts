import * as z from "zod";

/**
 * JSON helper for **client** TanStack Query `queryFn`s.
 * Web `fetch` only — not Next’s server `fetch`. See `docs/data.md`.
 * Throws on HTTP error (Query expects that):
 * https://tanstack.com/query/latest/docs/framework/react/guides/query-functions
 * Parses the JSON body with `schema` so Query cache holds domain types (`Date`,
 * enums) instead of `JSON.parse` wire shapes.
 */
export const fetcher = async <S extends z.ZodType>(
  url: string,
  schema: S,
): Promise<z.output<S>> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return schema.parse(await res.json());
};
