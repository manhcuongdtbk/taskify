import { describe, expect, test } from "vitest";
import { z } from "zod";

import { DeleteBoard } from "./schema";

describe("DeleteBoard", () => {
  test("valid: accepts an id", () => {
    const result = DeleteBoard.safeParse({ id: "board_1" });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "board_1" },
    });
  });

  test("invalid: requires id", () => {
    const result = DeleteBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      id: ["Invalid input: expected string, received undefined"],
    });
  });
});
