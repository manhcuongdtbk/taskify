import { describe, expect, test } from "vitest";

import {
  FREE_PLAN,
  PRO_PLAN,
  formatBoardLimit,
  hasUnlimitedBoards,
} from "./pricing-plans";

describe("hasUnlimitedBoards", () => {
  test("Free plan is limited", () => {
    expect(hasUnlimitedBoards(FREE_PLAN)).toBe(false);
  });

  test("Pro plan is unlimited", () => {
    expect(hasUnlimitedBoards(PRO_PLAN)).toBe(true);
  });
});

describe("formatBoardLimit", () => {
  test.for([
    { maxBoards: 1, expected: "Up to 1 boards" },
    { maxBoards: null, expected: "Unlimited boards" },
  ])(
    "valid: formats maxBoards=$maxBoards as $expected",
    ({ maxBoards, expected }) => {
      expect(formatBoardLimit(maxBoards)).toBe(expected);
    },
  );

  test.for([0, -1, 1.5, Number.NaN])(
    "invalid: throws when maxBoards is not a positive integer ($0)",
    (maxBoards) => {
      expect(() => formatBoardLimit(maxBoards)).toThrow(/positive integer/i);
    },
  );
});
