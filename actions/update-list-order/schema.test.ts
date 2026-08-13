import { parseISO } from "date-fns";
import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateListOrderSchema } from "./schema";

const listItem = {
  id: "list_1",
  title: "Todo",
  order: 0,
  createdAt: parseISO("2024-01-01T00:00:00.000Z"),
  updatedAt: parseISO("2024-01-02T00:00:00.000Z"),
};

describe("UpdateListOrderSchema", () => {
  test("valid: accepts a reorder payload", () => {
    const result = UpdateListOrderSchema.safeParse({
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
    const result = UpdateListOrderSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [invalidTypeArray],
      boardId: [invalidTypeString],
    });
  });

  test("invalid: rejects items with omitted fields", () => {
    const result = UpdateListOrderSchema.safeParse({
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
