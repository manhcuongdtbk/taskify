import { describe, expect, test } from "vitest";
import { z } from "zod";

import { UpdateBoard } from "./schema";

describe("UpdateBoard", () => {
  test("accepts a valid update", () => {
    const result = UpdateBoard.safeParse({
      title: "Renamed",
      id: "board_1",
    });

    expect(result).toEqual({
      success: true,
      data: { title: "Renamed", id: "board_1" },
    });
  });

  test("requires title and id", () => {
    const result = UpdateBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toEqual({
      title: ["Title is required"],
      id: ["Invalid input: expected string, received undefined"],
    });
  });

  test("rejects titles shorter than 3 characters", () => {
    const result = UpdateBoard.safeParse({ title: "ab", id: "board_1" });

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
