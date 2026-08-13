import { partialMatchKey } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";

import { cardQueries } from "./card";

describe("cardQueries", () => {
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

  // The route serves findUnique's result, so a deleted or cross-org card comes
  // back as a 200 null body — fetcher does not throw, and null reaches the UI.
  test("detail queryFn surfaces a null body for a missing card", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(null),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.detail("card_1");
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(body).toBeNull();
  });

  test("auditLogs builds key and enables when id is set", () => {
    const options = cardQueries.auditLogs("card_1");

    expect(options.queryKey).toStrictEqual(["card", "card_1", "auditLogs"]);
    expect(options.enabled).toBe(true);
  });

  test("auditLogs disables when id is missing", () => {
    expect(cardQueries.auditLogs(undefined).enabled).toBe(false);
  });

  test("auditLogs queryFn fetches card audit logs by card id", async () => {
    const cardAuditLogs = [{ id: "auditLog_1", action: "CREATE" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(cardAuditLogs),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.auditLogs("card_1");
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/cards/card_1/audit-logs",
    );
    expect(body).toStrictEqual(cardAuditLogs);
  });

  // partialMatchKey is what invalidateQueries uses — assert our key shapes
  // against it without standing up a QueryClient.
  describe("key scoping", () => {
    const scope = cardQueries.byId("card_1");
    const detail = cardQueries.detail("card_1").queryKey;
    const auditLogs = cardQueries.auditLogs("card_1").queryKey;
    const otherDetail = cardQueries.detail("card_2").queryKey;

    test("byId is a prefix of every leaf for that card and no other card", () => {
      expect(partialMatchKey(detail, scope)).toBe(true);
      expect(partialMatchKey(auditLogs, scope)).toBe(true);
      expect(partialMatchKey(otherDetail, scope)).toBe(false);
    });

    test("a leaf key is never a prefix of a sibling leaf", () => {
      // Regression: detail used to be ["card", id], which also matched
      // ["card", id, "auditLogs"] — so invalidating both refetched card
      // audit logs twice.
      expect(partialMatchKey(auditLogs, detail)).toBe(false);
      expect(partialMatchKey(detail, auditLogs)).toBe(false);
    });
  });
});
