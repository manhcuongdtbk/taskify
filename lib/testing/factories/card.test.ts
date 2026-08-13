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
    const overrides = { title: "Renamed", listId: "list_other" };
    const card = cardFactory.build(overrides);

    expect(card).toMatchObject(overrides);
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
      listId: "list_1",
      list: { title: "Todo" },
    });
  });

  test("merges card and list title overrides", () => {
    const overrides = {
      title: "Renamed",
      description: "Details",
      list: { title: "Doing" },
    };
    const card = cardWithListTitleFactory.build(overrides);

    expect(card).toMatchObject(overrides);
  });
});
