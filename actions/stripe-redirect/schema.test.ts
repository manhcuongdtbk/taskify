import { describe, expect, test } from "vitest";

import { StripeRedirectSchema } from "./schema";

describe("StripeRedirectSchema", () => {
  test("valid: accepts an empty object", () => {
    const result = StripeRedirectSchema.safeParse({});

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });

  test("valid: strips unknown keys", () => {
    const result = StripeRedirectSchema.safeParse({ unused: true });

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });
});
