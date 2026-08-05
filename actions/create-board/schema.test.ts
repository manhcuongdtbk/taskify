import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { CreateBoard } from "./schema";

describe("CreateBoard", () => {
  test("valid: accepts a board", () => {
    const result = CreateBoard.safeParse({
      title: "Roadmap",
      image: "img|thumb|full|user|html",
    });

    expect(result).toStrictEqual({
      success: true,
      data: {
        title: "Roadmap",
        image: "img|thumb|full|user|html",
      },
    });
  });

  test("invalid: requires title and image", () => {
    const result = CreateBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is required"],
      image: ["Image is required"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateBoard.safeParse({
      title: "ab",
      image: "img|thumb|full|user|html",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
