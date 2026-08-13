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
    const board = boardFactory.build({
      title: "Old title",
      orgId: "org_other",
    });

    expect(board.title).toBe("Old title");
    expect(board.orgId).toBe("org_other");
  });
});
