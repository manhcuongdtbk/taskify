import { beforeEach, describe, expect, test } from "vitest";

import { cardFactory, rewindCardFactory } from "./card";
import {
  listFactory,
  listWithCardsOrderedByOrderAscFactory,
  rewindListFactory,
  rewindListWithCardsOrderedByOrderAscFactory,
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
    const overrides = { title: "Doing", boardId: "board_other" };
    const list = listFactory.build(overrides);

    expect(list).toMatchObject(overrides);
  });
});

describe("listWithCardsOrderedByOrderAscFactory", () => {
  beforeEach(() => {
    rewindListWithCardsOrderedByOrderAscFactory();
    rewindCardFactory();
  });

  test("builds a ListWithCardsOrderedByOrderAsc with empty cards by default", () => {
    expect(listWithCardsOrderedByOrderAscFactory.build()).toMatchObject({
      id: "list_1",
      title: "Todo",
      boardId: "board_1",
      cards: [],
    });
  });

  test("accepts cards via associations and syncs listId", () => {
    const list = listWithCardsOrderedByOrderAscFactory.build(
      {},
      {
        associations: {
          cards: cardFactory.buildList(2),
        },
      },
    );

    expect(list.cards).toHaveLength(2);
    expect(list.cards[0]?.listId).toBe(list.id);
    expect(list.cards[1]?.listId).toBe(list.id);
  });

  test("orders associated cards by order asc", () => {
    const later = cardFactory.build({ id: "card_later", order: 1 });
    const earlier = cardFactory.build({ id: "card_earlier", order: 0 });
    const list = listWithCardsOrderedByOrderAscFactory.build(
      {},
      {
        associations: {
          cards: [later, earlier],
        },
      },
    );

    expect(list.cards.map((card) => card.id)).toStrictEqual([
      "card_earlier",
      "card_later",
    ]);
  });
});
