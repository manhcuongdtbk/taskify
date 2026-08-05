import { describe, expect, test } from "vitest";
import { z } from "zod";

import { DeleteList } from "./schema";

describe("DeleteList", () => {
  test("accepts a valid delete payload", () => {
    const result = DeleteList.safeParse({
      id: "list_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "list_1", boardId: "board_1" },
    });
  });

  test("requires id and boardId", () => {
    const result = DeleteList.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      id: ["Invalid input: expected string, received undefined"],
      boardId: ["Invalid input: expected string, received undefined"],
    });
  });
});
