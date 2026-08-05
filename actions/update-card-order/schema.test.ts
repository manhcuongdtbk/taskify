import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { UpdateCardOrder } from "./schema";

const cardItem = {
  id: "card_1",
  title: "Ship it",
  order: 0,
  listId: "list_1",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

describe("UpdateCardOrder", () => {
  test("valid: accepts a reorder payload", () => {
    const result = UpdateCardOrder.safeParse({
      items: [cardItem],
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        items: [cardItem],
        boardId: "board_1",
      },
    });
  });

  test("invalid: requires items and boardId", () => {
    const result = UpdateCardOrder.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: ["Invalid input: expected array, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects items with invalid fields", () => {
    const result = UpdateCardOrder.safeParse({
      items: [{ id: "card_1" }],
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [
        "Invalid input: expected string, received undefined",
        "Invalid input: expected number, received undefined",
        "Invalid input: expected string, received undefined",
        "Invalid input: expected date, received undefined",
        "Invalid input: expected date, received undefined",
      ],
    });
  });
});
