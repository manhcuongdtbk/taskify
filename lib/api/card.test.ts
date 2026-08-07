import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, test, vi } from "vitest";

import { type CardWithList } from "@/types";
import { cardQueries } from "./card";

describe("cardQueries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("all returns the card root key", () => {
    expect(cardQueries.all()).toStrictEqual(["card"]);
  });

  test("byId returns the per-card scope key", () => {
    expect(cardQueries.byId("card_1")).toStrictEqual(["card", "card_1"]);
  });

  test("detail builds key and enables when id is set", () => {
    const options = cardQueries.detail("card_1");

    expect(options.queryKey).toStrictEqual(["card", "card_1", "detail"]);
    expect(options.enabled).toBe(true);
  });

  test("detail disables when id is missing", () => {
    expect(cardQueries.detail(undefined).enabled).toBe(false);
  });

  test("detail queryFn fetches the card by id", async () => {
    const card = { id: "card_1", title: "Ship it" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(card),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.detail("card_1");
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(body).toStrictEqual(card);
  });

  test("logs builds key and enables when id is set", () => {
    const options = cardQueries.logs("card_1");

    expect(options.queryKey).toStrictEqual(["card", "card_1", "logs"]);
    expect(options.enabled).toBe(true);
  });

  test("logs disables when id is missing", () => {
    expect(cardQueries.logs(undefined).enabled).toBe(false);
  });

  test("logs queryFn fetches audit logs by card id", async () => {
    const logs = [{ id: "log_1", action: "CREATE" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(logs),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.logs("card_1");
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1/logs");
    expect(body).toStrictEqual(logs);
  });

  // findAll is the matcher invalidateQueries runs — keys are prefixes, not exact.
  describe("key scoping", () => {
    const seedCache = () => {
      const queryClient = new QueryClient();

      // Shape is irrelevant here; only the keys are under test.
      queryClient.setQueryData(cardQueries.detail("card_1").queryKey, {
        id: "card_1",
      } as CardWithList);
      queryClient.setQueryData(cardQueries.logs("card_1").queryKey, []);
      queryClient.setQueryData(cardQueries.detail("card_2").queryKey, {
        id: "card_2",
      } as CardWithList);

      return queryClient;
    };

    test("byId scopes every leaf of one card and no other card", () => {
      const queryClient = seedCache();

      const matched = queryClient
        .getQueryCache()
        .findAll({ queryKey: cardQueries.byId("card_1") })
        .map((query) => query.queryKey);

      expect(matched).toStrictEqual([
        ["card", "card_1", "detail"],
        ["card", "card_1", "logs"],
      ]);
    });

    test("a leaf key never scopes a sibling leaf", () => {
      const queryClient = seedCache();

      const matched = queryClient
        .getQueryCache()
        .findAll({ queryKey: cardQueries.detail("card_1").queryKey })
        .map((query) => query.queryKey);

      // Regression: detail used to be ["card", id], which also matched
      // ["card", id, "logs"] — so invalidating both refetched logs twice.
      expect(matched).toStrictEqual([["card", "card_1", "detail"]]);
    });
  });
});
