import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateBoardSchema } from "./schema";

describe("UpdateBoardSchema", () => {
  test("valid: accepts an update", () => {
    const result = UpdateBoardSchema.safeParse({
      title: "Renamed",
      id: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Renamed", id: "board_1" },
    });
  });

  test("invalid: requires title and id", () => {
    const result = UpdateBoardSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [invalidTypeString],
      id: [invalidTypeString],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = UpdateBoardSchema.safeParse({ title: "ab", id: "board_1" });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
    });
  });
});
