import { describe, expect, test } from "vitest";

import {
  cardAuditLogFactory,
  cardWithListFactory,
} from "@/lib/testing/factories/card";

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

const card = cardWithListFactory.build();
const log = cardAuditLogFactory.build();

describe("card MSW handlers", () => {
  test("exports path constants used by cardQueries", () => {
    expect(cardDetailPath).toBe("/api/cards/:cardId");
    expect(cardLogsPath).toBe("/api/cards/:cardId/logs");
  });

  test("serves card detail and logs JSON", async () => {
    server.use(cardDetailOk(card), cardLogsOk([log]));

    const detail = await fetch("/api/cards/card_1");
    const logs = await fetch("/api/cards/card_1/logs");

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toStrictEqual({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      list: {
        ...card.list,
        createdAt: card.list.createdAt.toISOString(),
        updatedAt: card.list.updatedAt.toISOString(),
      },
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
    server.use(cardDetailOk(null));

    const detail = await fetch("/api/cards/card_1");

    expect(detail.ok).toBe(true);
    await expect(detail.json()).resolves.toBeNull();
  });

  test("serves unauthorized text responses", async () => {
    server.use(cardDetailUnauthorized(), cardLogsUnauthorized());

    const detail = await fetch("/api/cards/card_1");
    const logs = await fetch("/api/cards/card_1/logs");

    expect(detail.status).toBe(401);
    await expect(detail.text()).resolves.toBe("Unauthorized");
    expect(logs.status).toBe(401);
    await expect(logs.text()).resolves.toBe("Unauthorized");
  });

  test("pending handlers never settle", async () => {
    server.use(cardDetailPending(), cardLogsPending());

    const detail = fetch("/api/cards/card_1");
    const logs = fetch("/api/cards/card_1/logs");

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
