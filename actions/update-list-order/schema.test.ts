import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateListOrder } from "./schema";

const listItem = {
  id: "list_1",
  title: "Todo",
  order: 0,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

describe("UpdateListOrder", () => {
  test("valid: accepts a reorder payload", () => {
    const result = UpdateListOrder.safeParse({
      items: [listItem],
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        items: [listItem],
        boardId: "board_1",
      },
    });
  });

  test("invalid: requires items and boardId", () => {
    const result = UpdateListOrder.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [invalidTypeArray],
      boardId: [invalidTypeString],
    });
  });

  test("invalid: rejects items with invalid fields", () => {
    const result = UpdateListOrder.safeParse({
      items: [{ id: "list_1" }],
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [
        invalidTypeString,
        invalidTypeNumber,
        invalidTypeDate,
        invalidTypeDate,
      ],
    });
  });
});
