import { describe, expect, test, vi } from "vitest";
import * as z from "zod";

import { createQueryClient, retryQuery } from "@/lib/tanstack-query/client";
import { FetcherHttpError } from "@/lib/tanstack-query/fetcher";
import { cardQueries } from "@/lib/tanstack-query/resources/card";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";

const jsonBody = (value: unknown) => JSON.parse(JSON.stringify(value));

const fetchQueryClient = () => {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      retryDelay: 0,
    },
  });
  return queryClient;
};

describe("retryQuery", () => {
  test("does not retry HTTP 4xx from fetcher except 408 and 429", () => {
    expect(retryQuery(0, new FetcherHttpError(404, "Not Found"))).toBe(false);
    expect(retryQuery(0, new FetcherHttpError(401, "Unauthorized"))).toBe(
      false,
    );
  });

  test("retries HTTP 408 and 429 from fetcher up to three times", () => {
    const requestTimeout = new FetcherHttpError(408, "Request Timeout");
    const tooManyRequests = new FetcherHttpError(429, "Too Many Requests");

    expect(retryQuery(0, requestTimeout)).toBe(true);
    expect(retryQuery(3, requestTimeout)).toBe(false);
    expect(retryQuery(0, tooManyRequests)).toBe(true);
    expect(retryQuery(3, tooManyRequests)).toBe(false);
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

    const error = await fetchQueryClient()
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

  test("retries HTTP 408 card detail until the request succeeds", async () => {
    const card = cardWithListTitleFactory.build();
    const json = vi.fn().mockResolvedValue(jsonBody(card));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 408,
        statusText: "Request Timeout",
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 408,
        statusText: "Request Timeout",
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 408,
        statusText: "Request Timeout",
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json,
      });
    vi.stubGlobal("fetch", fetchMock);

    const body = await fetchQueryClient().fetchQuery(
      cardQueries.detail(card.id),
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenCalledWith(`/api/cards/${card.id}`);
    expect(json).toHaveBeenCalledOnce();
    expect(body).toStrictEqual(card);
  });

  test("retries HTTP 429 card detail three times then fails", async () => {
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    const error = await fetchQueryClient()
      .fetchQuery(cardQueries.detail("card_1"))
      .then(
        () => {
          throw new Error("expected fetchQuery to reject");
        },
        (reason: unknown) => reason,
      );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenCalledWith("/api/cards/card_1");
    expect(json).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(FetcherHttpError);
  });
});
