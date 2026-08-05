import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { DeleteCard } from "./schema";

describe("DeleteCard", () => {
  test("valid: accepts a delete payload", () => {
    const result = DeleteCard.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("invalid: requires id and boardId", () => {
    const result = DeleteCard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      id: ["Invalid input: expected string, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });
});
