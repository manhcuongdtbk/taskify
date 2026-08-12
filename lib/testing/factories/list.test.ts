import { beforeEach, describe, expect, test } from "vitest";

import { cardFactory, rewindCardFactory } from "./card";
import {
  listFactory,
  listWithCardsFactory,
  rewindListFactory,
  rewindListWithCardsFactory,
} from "./list";

describe("listFactory", () => {
  beforeEach(() => {
    rewindListFactory();
  });

  test("builds a List row with sequenced defaults (no nested cards)", () => {
    const list = listFactory.build();

    expect(list).toMatchObject({
      id: "list_1",
      title: "Todo",
      boardId: "board_1",
    });
    expect(list).not.toHaveProperty("cards");
  });

  test("merges overrides", () => {
    const list = listFactory.build({
      title: "Doing",
      boardId: "board_other",
    });

    expect(list.title).toBe("Doing");
    expect(list.boardId).toBe("board_other");
  });
});

describe("listWithCardsFactory", () => {
  beforeEach(() => {
    rewindListWithCardsFactory();
    rewindCardFactory();
  });

  test("builds a ListWithCards with empty cards by default", () => {
    expect(listWithCardsFactory.build()).toMatchObject({
      id: "list_1",
      title: "Todo",
      boardId: "board_1",
      cards: [],
    });
  });

  test("accepts cards via associations and syncs listId", () => {
    const list = listWithCardsFactory.build(
      {},
      {
        associations: {
          cards: [
            cardFactory.build({ listId: "ignored" }),
            cardFactory.build({ listId: "ignored" }),
          ],
        },
      },
    );

    expect(list.cards).toHaveLength(2);
    expect(list.cards[0]?.listId).toBe(list.id);
    expect(list.cards[1]?.listId).toBe(list.id);
  });
});
