import { describe, expect, test } from "vitest";
import { z } from "zod";

import { UpdateList } from "./schema";

describe("UpdateList", () => {
  test("accepts a valid update", () => {
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

  test("requires title, id, and boardId", () => {
    const result = UpdateList.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      title: ["Title is required"],
      id: ["Invalid input: expected string, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects titles shorter than 3 characters", () => {
    const result = UpdateList.safeParse({
      title: "ab",
      id: "list_1",
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
