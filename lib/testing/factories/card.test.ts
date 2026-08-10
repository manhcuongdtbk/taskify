import { describe, expect, test } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

import { cardAuditLogFactory, cardWithListFactory, listFactory } from "./card";

describe("listFactory", () => {
  test("builds a List with defaults", () => {
    expect(listFactory.build()).toMatchObject({
      id: "list_1",
      title: "Todo",
      boardId: "board_1",
    });
  });
});

describe("cardWithListFactory", () => {
  test("builds a CardWithList with defaults", () => {
    expect(cardWithListFactory.build()).toMatchObject({
      id: "card_1",
      title: "Ship P2",
      listId: "list_1",
      list: { id: "list_1", title: "Todo", boardId: "board_1" },
    });
  });

  test("merges card and nested list overrides", () => {
    const card = cardWithListFactory.build({
      title: "Renamed",
      description: "Details",
      list: { title: "Doing" },
    });

    expect(card.title).toBe("Renamed");
    expect(card.description).toBe("Details");
    expect(card.list.title).toBe("Doing");
    expect(card.list.boardId).toBe("board_1");
  });
});

describe("cardAuditLogFactory", () => {
  test("builds an AuditLog with defaults", () => {
    expect(cardAuditLogFactory.build()).toMatchObject({
      id: "log_1",
      action: ACTION.CREATE,
      entityType: ENTITY_TYPE.CARD,
      entityId: "card_1",
      entityTitle: "Ship P2",
      userName: "Ada Lovelace",
    });
  });

  test("merges overrides", () => {
    const log = cardAuditLogFactory.build({
      entityTitle: "Renamed",
      action: ACTION.UPDATE,
    });

    expect(log.entityTitle).toBe("Renamed");
    expect(log.action).toBe(ACTION.UPDATE);
    expect(log.entityId).toBe("card_1");
  });
});
