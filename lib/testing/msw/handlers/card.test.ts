import { describe, expect, test } from "vitest";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";

import { server } from "../server";
import { stillPending } from "./helpers/still-pending";
import {
  cardAuditLogsInvalidJson,
  cardAuditLogsNotFound,
  cardAuditLogsOk,
  cardAuditLogsPending,
  cardAuditLogsUnauthorized,
  cardDetailInvalidJson,
  cardDetailNotFound,
  cardDetailOk,
  cardDetailPending,
  cardDetailUnauthorized,
} from "./card";

describe("card MSW handlers", () => {
  test("serves card detail and card audit logs JSON", async () => {
    const card = cardWithListTitleFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailOk(card), cardAuditLogsOk([cardAuditLog]));

    const detail = await fetch(`/api/cards/${card.id}`);
    const cardAuditLogsResponse = await fetch(
      `/api/cards/${card.id}/audit-logs`,
    );

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toStrictEqual({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      list: card.list,
    });
    expect(cardAuditLogsResponse.ok).toBe(true);
    await expect(cardAuditLogsResponse.json()).resolves.toStrictEqual([
      {
        ...cardAuditLog,
        createdAt: cardAuditLog.createdAt.toISOString(),
        updatedAt: cardAuditLog.updatedAt.toISOString(),
      },
    ]);
  });

  test("serves not found for a missing card", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailNotFound(), cardAuditLogsNotFound());

    const detail = await fetch(`/api/cards/${card.id}`);
    const cardAuditLogsResponse = await fetch(
      `/api/cards/${card.id}/audit-logs`,
    );

    expect(detail.status).toBe(404);
    await expect(detail.text()).resolves.toBe("Not Found");
    expect(cardAuditLogsResponse.status).toBe(404);
    await expect(cardAuditLogsResponse.text()).resolves.toBe("Not Found");
  });

  test("serves unauthorized text responses", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailUnauthorized(), cardAuditLogsUnauthorized());

    const detail = await fetch(`/api/cards/${card.id}`);
    const cardAuditLogsResponse = await fetch(
      `/api/cards/${card.id}/audit-logs`,
    );

    expect(detail.status).toBe(401);
    await expect(detail.text()).resolves.toBe("Unauthorized");
    expect(cardAuditLogsResponse.status).toBe(401);
    await expect(cardAuditLogsResponse.text()).resolves.toBe("Unauthorized");
  });

  test("serves 200 bodies that are not a card or card audit logs", async () => {
    server.use(cardDetailInvalidJson(), cardAuditLogsInvalidJson());

    const detail = await fetch("/api/cards/card_1");
    const cardAuditLogsResponse = await fetch("/api/cards/card_1/audit-logs");

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toStrictEqual({ id: "card_1" });
    expect(cardAuditLogsResponse.ok).toBe(true);
    await expect(cardAuditLogsResponse.json()).resolves.toStrictEqual([
      { id: "auditLog_1" },
    ]);
  });

  test("pending handlers never settle", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardAuditLogsPending());

    const detail = fetch(`/api/cards/${card.id}`);
    const cardAuditLogsResponse = fetch(`/api/cards/${card.id}/audit-logs`);

    await expect(stillPending(detail)).resolves.toBe("pending");
    await expect(stillPending(cardAuditLogsResponse)).resolves.toBe("pending");
  });
});
