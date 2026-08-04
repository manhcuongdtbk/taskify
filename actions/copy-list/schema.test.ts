import { describe, expect, test } from "vitest";
import { z } from "zod";

import { CopyList } from "./schema";

describe("CopyList", () => {
  test("accepts a valid copy payload", () => {
    const result = CopyList.safeParse({
      id: "list_1",
      boardId: "board_1",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "list_1", boardId: "board_1" },
    });
  });

  test("requires id and boardId", () => {
    const result = CopyList.safeParse({});

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
