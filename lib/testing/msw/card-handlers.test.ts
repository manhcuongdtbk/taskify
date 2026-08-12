import { describe, expect, test } from "vitest";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";

import {
  cardDetailOk,
  cardDetailPath,
  cardDetailPending,
  cardDetailUnauthorized,
  cardLogsOk,
  cardLogsPath,
  cardLogsPending,
  cardLogsUnauthorized,
} from "./card-handlers";
import { server } from "./server";

describe("card MSW handlers", () => {
  test("exports path constants used by cardQueries", () => {
    expect(cardDetailPath).toBe("/api/cards/:cardId");
    expect(cardLogsPath).toBe("/api/cards/:cardId/logs");
  });

  test("serves card detail and logs JSON", async () => {
    const card = cardWithListTitleFactory.build();
    const log = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailOk(card), cardLogsOk([log]));

    const detail = await fetch(`/api/cards/${card.id}`);
    const logs = await fetch(`/api/cards/${card.id}/logs`);

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toStrictEqual({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      list: card.list,
    });
    expect(logs.ok).toBe(true);
    await expect(logs.json()).resolves.toStrictEqual([
      {
        ...log,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
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
    server.use(cardDetailUnauthorized(), cardLogsUnauthorized());

    const detail = await fetch(`/api/cards/${card.id}`);
    const logs = await fetch(`/api/cards/${card.id}/logs`);

    expect(detail.status).toBe(401);
    await expect(detail.text()).resolves.toBe("Unauthorized");
    expect(logs.status).toBe(401);
    await expect(logs.text()).resolves.toBe("Unauthorized");
  });

  test("pending handlers never settle", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardLogsPending());

    const detail = fetch(`/api/cards/${card.id}`);
    const logs = fetch(`/api/cards/${card.id}/logs`);

    await expect(
      Promise.race([
        detail.then(() => "settled"),
        new Promise((resolve) => setTimeout(() => resolve("pending"), 50)),
      ]),
    ).resolves.toBe("pending");
    await expect(
      Promise.race([
        logs.then(() => "settled"),
        new Promise((resolve) => setTimeout(() => resolve("pending"), 50)),
      ]),
    ).resolves.toBe("pending");
  });
});
