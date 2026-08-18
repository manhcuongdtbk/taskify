import { describe, expect, test } from "vitest";

import {
  getCreateBoardHintDescription,
  getCreateBoardHintLabel,
  getCreateBoardRemainingCopy,
} from "./create-board-limit-copy";

describe("board limit copy helpers", () => {
  test("Free: clamps remaining at 0 and formats as remaining copy", () => {
    expect(
      getCreateBoardRemainingCopy({ availableCount: 3, isPro: false }),
    ).toBe("2 remaining");

    // Counter drift across plan changes should not show negative copy.
    expect(
      getCreateBoardRemainingCopy({ availableCount: 10, isPro: false }),
    ).toBe("0 remaining");
  });

  test("Free: hint describes the Free plan cap", () => {
    expect(getCreateBoardHintLabel({ isPro: false })).toBe(
      "Free plan board limit",
    );
    expect(getCreateBoardHintDescription({ isPro: false })).toContain(
      "Free Workspaces can have up to 5 open boards.",
    );
  });

  test("Pro unlimited: remaining + hint copy switch to Pro messaging", () => {
    expect(
      getCreateBoardRemainingCopy({ availableCount: 100, isPro: true }),
    ).toBe("Unlimited boards");
    expect(getCreateBoardHintLabel({ isPro: true })).toBe(
      "Pro plan board limit",
    );
    expect(getCreateBoardHintDescription({ isPro: true })).toBe(
      "Pro Workspaces have unlimited open boards.",
    );
  });
});
