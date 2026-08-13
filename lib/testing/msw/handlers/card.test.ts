import { describe, expect, test } from "vitest";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";

import { server } from "../server";
import {
  cardAuditLogsOk,
  cardAuditLogsPending,
  cardAuditLogsUnauthorized,
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

  test("serves a null card body", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailOk(null));

    const detail = await fetch(`/api/cards/${card.id}`);

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toBeNull();
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

  test("pending handlers never settle", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardAuditLogsPending());

    const detail = fetch(`/api/cards/${card.id}`);
    const cardAuditLogsResponse = fetch(`/api/cards/${card.id}/audit-logs`);

    await expect(
      Promise.race([
        detail.then(() => "settled"),
        new Promise((resolve) => setTimeout(() => resolve("pending"), 50)),
      ]),
    ).resolves.toBe("pending");
    await expect(
      Promise.race([
        cardAuditLogsResponse.then(() => "settled"),
        new Promise((resolve) => setTimeout(() => resolve("pending"), 50)),
      ]),
    ).resolves.toBe("pending");
  });
});
