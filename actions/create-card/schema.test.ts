import { describe, expect, test } from "vitest";
import { z } from "zod";

import { CreateCard } from "./schema";

describe("CreateCard", () => {
  test("accepts a valid card", () => {
    const result = CreateCard.safeParse({
      title: "Write tests",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(result).toEqual({
      success: true,
      data: {
        title: "Write tests",
        boardId: "board_1",
        listId: "list_1",
      },
    });
  });

  test("requires title, boardId, and listId", () => {
    const result = CreateCard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      title: ["Title is required"],
      boardId: ["Invalid input: expected string, received undefined"],
      listId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects titles shorter than 3 characters", () => {
    const result = CreateCard.safeParse({
      title: "ab",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      title: ["Title is too short"],
    });
  });
});
