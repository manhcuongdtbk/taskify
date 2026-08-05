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
      title: ["Invalid input: expected string, received undefined"],
      image: ["Invalid input: expected string, received undefined"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateBoard.safeParse({
      title: "ab",
      image: "img|thumb|full|user|html",
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Too small: expected string to have >=3 characters"],
    });
  });
});
