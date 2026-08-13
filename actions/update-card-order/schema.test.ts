import { parseISO } from "date-fns";
import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateCardOrderSchema } from "./schema";

const cardItem = {
  id: "card_1",
  title: "Ship it",
  order: 0,
  listId: "list_1",
  createdAt: parseISO("2024-01-01T00:00:00.000Z"),
  updatedAt: parseISO("2024-01-02T00:00:00.000Z"),
};

describe("UpdateCardOrderSchema", () => {
  test("valid: accepts a reorder payload", () => {
    const result = UpdateCardOrderSchema.safeParse({
      items: [cardItem],
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        items: [cardItem],
        boardId: "board_1",
      },
    });
  });

  test("invalid: requires items and boardId", () => {
    const result = UpdateCardOrderSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [invalidTypeArray],
      boardId: [invalidTypeString],
    });
  });

  test("invalid: rejects items with omitted fields", () => {
    const result = UpdateCardOrderSchema.safeParse({
      items: [{ id: "card_1" }],
      boardId: "board_1",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      items: [
        invalidTypeString,
        invalidTypeNumber,
        invalidTypeString,
        invalidTypeDate,
        invalidTypeDate,
      ],
    });
  });
});
