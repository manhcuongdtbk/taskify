import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { UpdateCard } from "./schema";

describe("UpdateCard", () => {
  test("valid: accepts id and boardId with no optional fields", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("valid: accepts optional title and description when long enough", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "New title",
      description: "More detail",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        id: "card_1",
        boardId: "board_1",
        title: "New title",
        description: "More detail",
      },
    });
  });

  test("invalid: requires id and boardId", () => {
    const result = UpdateCard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      boardId: ["Invalid input: expected string, received undefined"],
      id: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects short optional title and description", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "ab",
      description: "cd",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is too short"],
      description: ["Description is too short"],
    });
  });
});
