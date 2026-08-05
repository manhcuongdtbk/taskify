import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { CreateList } from "./schema";

describe("CreateList", () => {
  test("valid: accepts a list", () => {
    const result = CreateList.safeParse({
      title: "Todo",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Todo", boardId: "board_1" },
    });
  });

  test("invalid: requires title and boardId", () => {
    const result = CreateList.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is required"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateList.safeParse({ title: "ab", boardId: "board_1" });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
