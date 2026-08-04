import { describe, expect, test } from "vitest";
import { z } from "zod";

import { DeleteCard } from "./schema";

describe("DeleteCard", () => {
  test("accepts a valid delete payload", () => {
    const result = DeleteCard.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("requires id and boardId", () => {
    const result = DeleteCard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      id: ["Invalid input: expected string, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });
});
