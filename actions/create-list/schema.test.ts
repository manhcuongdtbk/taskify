import { describe, expect, test } from "vitest";
import { z } from "zod";

import { CreateList } from "./schema";

describe("CreateList", () => {
  test("accepts a valid list", () => {
    const result = CreateList.safeParse({
      title: "Todo",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Todo", boardId: "board_1" },
    });
  });

  test("requires title and boardId", () => {
    const result = CreateList.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      title: ["Title is required"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects titles shorter than 3 characters", () => {
    const result = CreateList.safeParse({ title: "ab", boardId: "board_1" });

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
