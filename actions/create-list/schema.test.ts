import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { CreateListSchema } from "./schema";

describe("CreateListSchema", () => {
  test("valid: accepts a list", () => {
    const result = CreateListSchema.safeParse({
      title: "Todo",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Todo", boardId: "board_1" },
    });
  });

  test("invalid: requires title and boardId", () => {
    const result = CreateListSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [invalidTypeString],
      boardId: [invalidTypeString],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateListSchema.safeParse({
      title: "ab",
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
    });
  });
});
