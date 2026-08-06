import { describe, expect, test } from "vitest";

import { StripeRedirect } from "./schema";

describe("StripeRedirect", () => {
  test("valid: accepts an empty object", () => {
    const result = StripeRedirect.safeParse({});

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });

  test("valid: strips unknown keys", () => {
    const result = StripeRedirect.safeParse({ unused: true });

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });
});
