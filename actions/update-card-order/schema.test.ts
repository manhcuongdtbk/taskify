import { describe, expect, test } from "vitest";

import { cardFactory } from "@/lib/testing/factories/card";
import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeString,
} from "@/lib/testing/zod/default-issue-messages";

import { UpdateCardOrderSchema } from "./schema";

describe("UpdateCardOrderSchema", () => {
  test("valid: accepts a reorder payload", () => {
    const card = cardFactory.build({ title: "Ship it", order: 0 });
    const item = {
      id: card.id,
      title: card.title,
      order: card.order,
      listId: card.listId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };

    const result = UpdateCardOrderSchema.safeParse({
      items: [item],
      boardId: "board_1",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        items: [item],
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
