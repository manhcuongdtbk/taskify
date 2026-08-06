import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateBoard } from "./schema";

describe("UpdateBoard", () => {
  test("valid: accepts an update", () => {
    const result = UpdateBoard.safeParse({
      title: "Renamed",
      id: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Renamed", id: "board_1" },
    });
  });

  test("invalid: requires title and id", () => {
    const result = UpdateBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [invalidTypeString],
      id: [invalidTypeString],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = UpdateBoard.safeParse({ title: "ab", id: "board_1" });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
    });
  });
});
