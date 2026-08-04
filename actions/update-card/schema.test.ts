import { describe, expect, test } from "vitest";
import { z } from "zod";

import { UpdateCard } from "./schema";

describe("UpdateCard", () => {
  test("accepts id and boardId with no optional fields", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("accepts optional title and description when long enough", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "New title",
      description: "More detail",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "card_1",
        boardId: "board_1",
        title: "New title",
        description: "More detail",
      },
    });
  });

  test("requires id and boardId", () => {
    const result = UpdateCard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      boardId: ["Invalid input: expected string, received undefined"],
      id: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects short optional title and description", () => {
    const result = UpdateCard.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "ab",
      description: "cd",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      title: ["Title is too short"],
      description: ["Description is too short"],
    });
  });
});
