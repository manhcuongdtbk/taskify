import { describe, expect, test } from "vitest";

import {
  FREE_PLAN,
  PRO_PLAN,
  formatBoardLimit,
  hasUnlimitedBoards,
} from "./pricing-plans";

describe("hasUnlimitedBoards", () => {
  test("is false for Free (numeric maxBoards)", () => {
    expect(hasUnlimitedBoards(FREE_PLAN)).toBe(false);
  });

  test("is true for Pro (null maxBoards)", () => {
    expect(hasUnlimitedBoards(PRO_PLAN)).toBe(true);
  });
});

describe("formatBoardLimit", () => {
  test.for([
    { maxBoards: 5, expected: "Up to 5 boards" },
    { maxBoards: 1, expected: "Up to 1 boards" },
    { maxBoards: null, expected: "Unlimited boards" },
  ])("maxBoards=$maxBoards → $expected", ({ maxBoards, expected }) => {
    expect(formatBoardLimit(maxBoards)).toBe(expected);
  });
});
