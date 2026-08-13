import { beforeEach, describe, expect, test } from "vitest";

import { boardFactory, rewindBoardFactory } from "./board";

describe("boardFactory", () => {
  beforeEach(() => {
    rewindBoardFactory();
  });

  test("builds a Board row with sequenced defaults (no nested lists)", () => {
    const board = boardFactory.build();

    expect(board).toMatchObject({
      id: "board_1",
      orgId: "org_1",
      title: "Roadmap",
    });
    expect(board).not.toHaveProperty("lists");
  });

  test("merges overrides", () => {
    const overrides = { title: "Old title", orgId: "org_other" };
    const board = boardFactory.build(overrides);

    expect(board).toMatchObject(overrides);
  });
});
