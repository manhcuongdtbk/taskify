import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import { invalidTypeString } from "@/lib/testing/zod/default-issue-messages";

import { CopyCardSchema } from "./schema";

describe("CopyCardSchema", () => {
  test("valid: accepts a copy payload", () => {
    const result = CopyCardSchema.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("invalid: requires id and boardId", () => {
    const result = CopyCardSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      id: [invalidTypeString],
      boardId: [invalidTypeString],
    });
  });
});
