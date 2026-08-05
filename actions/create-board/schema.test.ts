import { describe, expect, test } from "vitest";
import { z } from "zod";

import { CreateBoard } from "./schema";

describe("CreateBoard", () => {
  test("accepts a valid board", () => {
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

  test("requires title and image", () => {
    const result = CreateBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      title: ["Title is required"],
      image: ["Image is required"],
    });
  });

  test("rejects titles shorter than 3 characters", () => {
    const result = CreateBoard.safeParse({
      title: "ab",
      image: "img|thumb|full|user|html",
    });

    expect(result.success).toBe(false);
    expect(
      z.flattenError(
        (result as Extract<typeof result, { success: false }>).error,
      ).fieldErrors,
    ).toStrictEqual({
      title: ["Title is too short"],
    });
  });
});
