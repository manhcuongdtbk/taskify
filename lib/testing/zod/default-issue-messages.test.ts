import { describe, expect, test } from "vitest";
import * as z from "zod";

import {
  invalidFormatUrl,
  invalidTypeArray,
  invalidTypeDate,
  invalidTypeNumber,
  invalidTypeObject,
  invalidTypeString,
  issueMessageOf,
  tooBigString,
  tooSmallNumber,
  tooSmallString,
} from "./default-issue-messages";

describe("zod default issue messages", () => {
  test("issueMessageOf throws when safeParse succeeded", () => {
    expect(() => issueMessageOf(z.string().trim().safeParse("ok"))).toThrow(
      "Expected safeParse to fail",
    );
  });

  test("issueMessageOf throws when the failed parse has no issue messages", () => {
    expect(() =>
      issueMessageOf({ success: false, error: new z.ZodError([]) }),
    ).toThrow("Expected at least one issue message");
  });

  test("issueMessageOf falls back to first fieldError when formErrors is empty", () => {
    // Example 1: a plain `z.string()` failure is reported as a "form" (top-level) issue message.
    expect(issueMessageOf(z.string().trim().safeParse(undefined))).toBe(
      invalidTypeString,
    );

    // Example 2:
    // - Schema: { title: string }
    // - Input: {}
    // `title` is undefined → Zod `invalid_type` under `fieldErrors.title`.
    const fieldOnly = z.object({ title: z.string().trim() }).safeParse({});
    if (fieldOnly.success) throw new Error("unreachable");

    const { formErrors, fieldErrors } = z.flattenError(fieldOnly.error);
    expect(formErrors.length).toBe(0); // no top-level issue message
    expect(fieldErrors["title"]?.[0]).toBe(invalidTypeString); // field-level issue message exists

    expect(issueMessageOf(fieldOnly)).toBe(invalidTypeString);
  });

  test("matches Zod’s English for common invalid_type cases", () => {
    expect(invalidTypeString).toBe(
      "Invalid input: expected string, received undefined",
    );
    expect(invalidTypeObject).toBe(
      "Invalid input: expected object, received undefined",
    );
    expect(invalidTypeArray).toBe(
      "Invalid input: expected array, received undefined",
    );
    expect(invalidTypeNumber).toBe(
      "Invalid input: expected number, received undefined",
    );
    expect(invalidTypeDate).toBe(
      "Invalid input: expected date, received undefined",
    );
  });

  test("matches Zod’s English for too_small, too_big, and invalid_format", () => {
    expect(tooSmallString(1)).toBe(
      "Too small: expected string to have >=1 characters",
    );
    expect(tooSmallString(3)).toBe(
      "Too small: expected string to have >=3 characters",
    );
    expect(tooBigString(3)).toBe(
      "Too big: expected string to have <=3 characters",
    );
    expect(tooSmallNumber(3)).toBe("Too small: expected number to be >=3");
    expect(invalidFormatUrl).toBe("Invalid URL");
  });

  test("stays aligned when taken from a real object field failure", () => {
    const result = z.object({ title: z.string().trim() }).safeParse({});

    expect(result.success).toBe(false);
    if (result.success) throw new Error("unreachable");

    expect(z.flattenError(result.error).fieldErrors.title).toStrictEqual([
      invalidTypeString,
    ]);
  });
});
