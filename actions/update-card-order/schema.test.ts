import { describe, expect, test } from "vitest";
import { z } from "zod";

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
  test("accepts a valid reorder payload", () => {
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

  test("requires items and boardId", () => {
    const result = UpdateCardOrder.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      items: ["Invalid input: expected array, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects items with invalid fields", () => {
    const result = UpdateCardOrder.safeParse({
      items: [{ id: "card_1" }],
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
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
