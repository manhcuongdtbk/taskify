import { describe, expect, test } from "vitest";
import { z } from "zod";

import { safeParseFieldErrors } from "./safe-parse-field-errors";

const Schema = z.object({
  id: z.string(),
});

describe("safeParseFieldErrors", () => {
  test("returns flattened fieldErrors from a failed safeParse", () => {
    const result = Schema.safeParse({});

    expect(result.success).toBe(false);
    expect(safeParseFieldErrors(result)).toStrictEqual({
      id: ["Invalid input: expected string, received undefined"],
    });
  });

  test("throws when safeParse succeeded", () => {
    const result = Schema.safeParse({ id: "ok" });

    expect(result.success).toBe(true);
    expect(() => safeParseFieldErrors(result)).toThrow(
      "Expected safeParse to fail",
    );
  });
});
