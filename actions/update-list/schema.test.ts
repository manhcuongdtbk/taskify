import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { UpdateList } from "./schema";

describe("UpdateList", () => {
  test("valid: accepts an update", () => {
    const result = UpdateList.safeParse({
      title: "Doing",
      id: "list_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        title: "Doing",
        id: "list_1",
        boardId: "board_1",
      },
    });
  });

  test("invalid: requires title, id, and boardId", () => {
    const result = UpdateList.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is required"],
      id: ["Invalid input: expected string, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = UpdateList.safeParse({
      title: "ab",
      id: "list_1",
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
