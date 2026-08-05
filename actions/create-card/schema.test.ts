import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { CreateCard } from "./schema";

describe("CreateCard", () => {
  test("valid: accepts a card", () => {
    const result = CreateCard.safeParse({
      title: "Write tests",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        title: "Write tests",
        boardId: "board_1",
        listId: "list_1",
      },
    });
  });

  test("invalid: requires title, boardId, and listId", () => {
    const result = CreateCard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is required"],
      boardId: ["Invalid input: expected string, received undefined"],
      listId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateCard.safeParse({
      title: "ab",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
