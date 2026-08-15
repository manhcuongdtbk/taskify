import { QueryClient } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import * as z from "zod";

import { createQueryClient, retryQuery } from "@/lib/tanstack-query/client";
import { FetcherHttpError } from "@/lib/tanstack-query/fetcher";
import { cardQueries } from "@/lib/tanstack-query/resources/card";

describe("retryQuery", () => {
  test("does not retry HTTP 4xx from fetcher", () => {
    expect(retryQuery(0, new FetcherHttpError(404, "Not Found"))).toBe(false);
    expect(retryQuery(0, new FetcherHttpError(401, "Unauthorized"))).toBe(
      false,
    );
  });

  test("retries HTTP 5xx from fetcher up to three times", () => {
    const error = new FetcherHttpError(500, "Internal Server Error");

    expect(retryQuery(0, error)).toBe(true);
    expect(retryQuery(3, error)).toBe(false);
  });

  test("retries other errors up to three times", () => {
    const error = new Error("network");

    expect(retryQuery(0, error)).toBe(true);
    expect(retryQuery(1, error)).toBe(true);
    expect(retryQuery(2, error)).toBe(true);
    expect(retryQuery(3, error)).toBe(false);
  });

  test("does not retry Zod parse failures", () => {
    const parsed = z.object({ id: z.string().trim() }).safeParse({});

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(retryQuery(0, parsed.error)).toBe(false);
  });
});

describe("createQueryClient", () => {
  test("uses retryQuery as the default query retry", () => {
    const queryClient = createQueryClient();

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(retryQuery);
  });

  test("does not refetch a 404 card detail", async () => {
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: retryQuery,
          retryDelay: 0,
        },
      },
    });
    const error = await queryClient
      .fetchQuery(cardQueries.detail("card_1"))
      .then(
        () => {
          throw new Error("expected fetchQuery to reject");
        },
        (reason: unknown) => reason,
      );

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(json).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(FetcherHttpError);
  });
});
