import { beforeEach, describe, expect, test } from "vitest";

import {
  cardFactory,
  cardWithListTitleFactory,
  rewindCardFactory,
  rewindCardWithListTitleFactory,
} from "./card";

describe("cardFactory", () => {
  beforeEach(() => {
    rewindCardFactory();
  });

  test("builds a Card row with sequenced defaults (no nested list)", () => {
    const card = cardFactory.build();

    expect(card).toMatchObject({
      id: "card_1",
      title: "Ship P2",
      listId: "list_1",
    });
    expect(card).not.toHaveProperty("list");
  });

  test("merges overrides", () => {
    const card = cardFactory.build({
      title: "Renamed",
      listId: "list_other",
    });

    expect(card.title).toBe("Renamed");
    expect(card.listId).toBe("list_other");
  });
});

describe("cardWithListTitleFactory", () => {
  beforeEach(() => {
    rewindCardWithListTitleFactory();
  });

  test("builds a CardWithListTitle with sequenced defaults (list title only)", () => {
    expect(cardWithListTitleFactory.build()).toMatchObject({
      id: "card_1",
      title: "Ship P2",
      list: { title: "Todo" },
    });
  });

  test("merges card and list title overrides", () => {
    const card = cardWithListTitleFactory.build({
      title: "Renamed",
      description: "Details",
      list: { title: "Doing" },
    });

    expect(card.title).toBe("Renamed");
    expect(card.description).toBe("Details");
    expect(card.list.title).toBe("Doing");
  });
});
