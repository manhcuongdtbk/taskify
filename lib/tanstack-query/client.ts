import { QueryClient } from "@tanstack/react-query";
import * as z from "zod";

import { FetcherHttpError } from "@/lib/tanstack-query/fetcher";

/**
 * Query `retry` callback — [Query Retries](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries).
 * Skip client HTTP errors (`FetcherHttpError` 4xx) except 408/429, and skip Zod
 * parse failures; otherwise keep Query’s default of 3 retries (`failureCount`
 * is 0 on the first retry decision). See `docs/data.md`.
 */
export const retryQuery = (failureCount: number, error: Error): boolean => {
  if (
    error instanceof FetcherHttpError &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429
  ) {
    return false;
  }

  if (error instanceof z.ZodError) {
    return false;
  }

  return failureCount < 3;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: retryQuery,
      },
    },
  });
