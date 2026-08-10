import { afterEach, describe, expect, test } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";
import { type CardWithList } from "@/types";

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

const card: CardWithList = {
  id: "card_1",
  title: "Ship P3",
  description: null,
  order: 0,
  listId: "list_1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  list: {
    id: "list_1",
    title: "Todo",
    order: 0,
    boardId: "board_1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
};

const log = {
  id: "log_1",
  orgId: "org_1",
  action: ACTION.CREATE,
  entityId: "card_1",
  entityType: ENTITY_TYPE.CARD,
  entityTitle: "Ship P3",
  userId: "user_1",
  userImage: "https://example.com/avatar.png",
  userName: "Ada Lovelace",
  createdAt: new Date("2026-01-15T10:30:00.000Z"),
  updatedAt: new Date("2026-01-15T10:30:00.000Z"),
};

describe("card MSW handlers", () => {
  afterEach(() => {
    server.resetHandlers();
  });

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
