import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

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
    expect(safeParseFieldErrors(result)).toStrictEqual({
      id: ["Invalid input: expected string, received undefined"],
    });
  });
});
