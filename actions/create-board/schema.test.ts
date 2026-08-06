import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";

import { CreateBoard } from "./schema";

const image = {
  id: "cXHsWI3gBws",
  thumbUrl:
    "https://images.unsplash.com/photo-1633933329875-044a32f4837f?w=200",
  fullUrl: "https://images.unsplash.com/photo-1633933329875-044a32f4837f?q=85",
  linkHTML: "https://unsplash.com/photos/cXHsWI3gBws",
  userName: "Svitlana",
};

describe("CreateBoard", () => {
  test("valid: accepts a board", () => {
    const result = CreateBoard.safeParse({ title: "Roadmap", image });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Roadmap", image },
    });
  });

  test("invalid: requires title and image", () => {
    const result = CreateBoard.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Invalid input: expected string, received undefined"],
      image: ["Invalid input: expected object, received undefined"],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateBoard.safeParse({ title: "ab", image });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: ["Too small: expected string to have >=3 characters"],
    });
  });

  test.for([
    { case: "id", value: { ...image, id: "" } },
    { case: "author", value: { ...image, userName: "" } },
  ])("invalid: rejects an image with an empty $case", ({ value }) => {
    const result = CreateBoard.safeParse({ title: "Roadmap", image: value });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      image: ["Too small: expected string to have >=1 characters"],
    });
  });

  test.for([
    { case: "thumbUrl", value: { ...image, thumbUrl: "not-a-url" } },
    { case: "fullUrl", value: { ...image, fullUrl: "not-a-url" } },
    { case: "linkHTML", value: { ...image, linkHTML: "not-a-url" } },
  ])("invalid: rejects an image whose $case is not a URL", ({ value }) => {
    const result = CreateBoard.safeParse({ title: "Roadmap", image: value });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      image: ["Invalid URL"],
    });
  });

  test("invalid: reports the whole image group under one key", () => {
    const result = CreateBoard.safeParse({ title: "Roadmap", image: {} });

    expect(result.success).toBe(false);
    expect(Object.keys(safeParseFieldErrors(result))).toStrictEqual(["image"]);
  });
});
