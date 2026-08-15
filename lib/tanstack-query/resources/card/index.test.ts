import { partialMatchKey } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import * as z from "zod";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";

import { cardQueries } from "./index";

const jsonBody = (value: unknown) => JSON.parse(JSON.stringify(value));

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

  test("detail queryFn maps JSON card dates to Date", async () => {
    const card = cardWithListTitleFactory.build();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jsonBody(card)),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.detail(card.id);
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`/api/cards/${card.id}`);
    expect(body).toStrictEqual(card);
  });

  test("detail queryFn throws when the card is missing", async () => {
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.detail("card_1");

    await expect((queryFn as () => Promise<unknown>)()).rejects.toThrow(
      "Request failed: 404 Not Found",
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(json).not.toHaveBeenCalled();
  });

  test("detail queryFn rejects a partial JSON card", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "card_1", title: "Ship it" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.detail("card_1");

    await expect((queryFn as () => Promise<unknown>)()).rejects.toBeInstanceOf(
      z.ZodError,
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
  });

  test("auditLogs builds key and enables when id is set", () => {
    const options = cardQueries.auditLogs("card_1");

    expect(options.queryKey).toStrictEqual(["card", "card_1", "auditLogs"]);
    expect(options.enabled).toBe(true);
  });

  test("auditLogs disables when id is missing", () => {
    expect(cardQueries.auditLogs(undefined).enabled).toBe(false);
  });

  test("auditLogs queryFn maps JSON audit-log dates to Date", async () => {
    const cardAuditLog = auditLogFactory.build();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jsonBody([cardAuditLog])),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.auditLogs("card_1");
    // Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
    const body = await (queryFn as () => Promise<unknown>)();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/cards/card_1/audit-logs",
    );
    expect(body).toStrictEqual([cardAuditLog]);
  });

  test("auditLogs queryFn rejects a partial JSON audit log", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: "auditLog_1", action: "CREATE" }]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { queryFn } = cardQueries.auditLogs("card_1");

    await expect((queryFn as () => Promise<unknown>)()).rejects.toBeInstanceOf(
      z.ZodError,
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/cards/card_1/audit-logs",
    );
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
