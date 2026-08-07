import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateCardSchema } from "./schema";

describe("UpdateCardSchema", () => {
  test("valid: accepts id and boardId with no optional fields", () => {
    const result = UpdateCardSchema.safeParse({
      id: "card_1",
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: "card_1", boardId: "board_1" },
    });
  });

  test("valid: accepts optional title and description when long enough", () => {
    const result = UpdateCardSchema.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "New title",
      description: "More detail",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        id: "card_1",
        boardId: "board_1",
        title: "New title",
        description: "More detail",
      },
    });
  });

  test("invalid: requires id and boardId", () => {
    const result = UpdateCardSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      boardId: [invalidTypeString],
      id: [invalidTypeString],
    });
  });

  test("invalid: rejects short optional title and description", () => {
    const result = UpdateCardSchema.safeParse({
      id: "card_1",
      boardId: "board_1",
      title: "ab",
      description: "cd",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
      description: [tooSmallString(3)],
    });
  });
});
