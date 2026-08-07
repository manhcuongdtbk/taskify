import { describe, expect, test } from "vitest";

import { safeParseFieldErrors } from "@/lib/testing/zod/safe-parse-field-errors";
import {
  invalidFormatUrl,
  invalidTypeObject,
  invalidTypeString,
  tooSmallString,
} from "@/lib/testing/zod/default-issue-messages";

import { CreateBoardSchema } from "./schema";

const image = {
  id: "cXHsWI3gBws",
  thumbUrl:
    "https://images.unsplash.com/photo-1633933329875-044a32f4837f?w=200",
  fullUrl: "https://images.unsplash.com/photo-1633933329875-044a32f4837f?q=85",
  linkHTML: "https://unsplash.com/photos/cXHsWI3gBws",
  userName: "Svitlana",
};

describe("CreateBoardSchema", () => {
  test("valid: accepts a board", () => {
    const result = CreateBoardSchema.safeParse({ title: "Roadmap", image });

    expect(result).toStrictEqual({
      success: true,
      data: { title: "Roadmap", image },
    });
  });

  test("invalid: requires title and image", () => {
    const result = CreateBoardSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [invalidTypeString],
      image: [invalidTypeObject],
    });
  });

  test("invalid: rejects titles shorter than 3 characters", () => {
    const result = CreateBoardSchema.safeParse({ title: "ab", image });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      title: [tooSmallString(3)],
    });
  });

  test.for([
    { case: "id", value: { ...image, id: "" } },
    { case: "author", value: { ...image, userName: "" } },
  ])("invalid: rejects an image with an empty $case", ({ value }) => {
    const result = CreateBoardSchema.safeParse({
      title: "Roadmap",
      image: value,
    });

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      image: [tooSmallString(1)],
    });
  });

  test.for([
    { case: "thumbUrl", value: { ...image, thumbUrl: "not-a-url" } },
    { case: "fullUrl", value: { ...image, fullUrl: "not-a-url" } },
    { case: "linkHTML", value: { ...image, linkHTML: "not-a-url" } },
    {
      case: "thumbUrl over http",
      value: { ...image, thumbUrl: "http://images.unsplash.com/photo.jpg" },
    },
  ])(
    "invalid: rejects an image whose $case is not a https URL",
    ({ value }) => {
      const result = CreateBoardSchema.safeParse({
        title: "Roadmap",
        image: value,
      });

      expect(result.success).toBe(false);
      expect(safeParseFieldErrors(result)).toStrictEqual({
        image: [invalidFormatUrl],
      });
    },
  );

  test("invalid: reports the whole image group under one key", () => {
    const result = CreateBoardSchema.safeParse({ title: "Roadmap", image: {} });

    expect(result.success).toBe(false);
    expect(Object.keys(safeParseFieldErrors(result))).toStrictEqual(["image"]);
  });
});
