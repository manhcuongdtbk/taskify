import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateListSchema } from "./schema";

describe("UpdateListSchema", () => {
  test("valid: accepts an update", () => {
    const result = UpdateListSchema.safeParse({
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

  test("invalid: requires title, id, and boardId", () => {
    const result = UpdateListSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [invalidTypeString],
      id: [invalidTypeString],
      boardId: [invalidTypeString],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = UpdateListSchema.safeParse({
      title: "ab",
      id: "list_1",
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
    });
  });
});
