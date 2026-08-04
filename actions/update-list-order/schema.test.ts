import { describe, expect, test } from "vitest";
import { z } from "zod";

import { UpdateListOrder } from "./schema";

const listItem = {
  id: "list_1",
  title: "Todo",
  order: 0,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

describe("UpdateListOrder", () => {
  test("accepts a valid reorder payload", () => {
    const result = UpdateListOrder.safeParse({
      items: [listItem],
      boardId: "board_1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        items: [listItem],
        boardId: "board_1",
      },
    });
  });

  test("requires items and boardId", () => {
    const result = UpdateListOrder.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      items: ["Invalid input: expected array, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects items with invalid fields", () => {
    const result = UpdateListOrder.safeParse({
      items: [{ id: "list_1" }],
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      items: [
        "Invalid input: expected string, received undefined",
        "Invalid input: expected number, received undefined",
        "Invalid input: expected date, received undefined",
        "Invalid input: expected date, received undefined",
      ],
    });
  });
});
