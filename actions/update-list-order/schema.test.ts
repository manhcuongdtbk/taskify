import { describe, expect, test } from "vitest";

import { listFactory } from "@/lib/testing/factories/list";
import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateListOrderSchema } from "./schema";

describe("UpdateListOrderSchema", () => {
  test("valid: accepts a reorder payload", () => {
    const list = listFactory.build({ title: "Todo", order: 0 });
    const item = {
      id: list.id,
      title: list.title,
      order: list.order,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };

    const result = UpdateListOrderSchema.safeParse({
      items: [item],
      boardId: list.boardId,
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        items: [item],
        boardId: list.boardId,
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
