import { afterEach, describe, expect, test, vi } from "vitest";

import { cardQueries } from "./card";

describe("cardQueries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("all returns the card root key", () => {
    expect(cardQueries.all()).toStrictEqual(["card"]);
  });

  test("detail builds key and enables when id is set", () => {
    const options = cardQueries.detail("card_1");

    expect(options.queryKey).toStrictEqual(["card", "card_1"]);
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
});
