import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import { invalidTypeString } from "@/lib/testing/zod/default-issue-messages";

import { DeleteBoardSchema } from "./schema";

describe("DeleteBoardSchema", () => {
  test("valid: accepts an id", () => {
    const result = DeleteBoardSchema.safeParse({ id: "board_1" });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "board_1" },
    });
  });

  test("invalid: requires id", () => {
    const result = DeleteBoardSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      id: [invalidTypeString],
    });
  });
});
