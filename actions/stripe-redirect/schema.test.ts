import { describe, expect, test } from "vitest";

import { StripeRedirect } from "./schema";

describe("StripeRedirect", () => {
  test("accepts an empty object", () => {
    const result = StripeRedirect.safeParse({});

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });

  test("strips unknown keys", () => {
    const result = StripeRedirect.safeParse({ unused: true });

    expect(result).toStrictEqual({
      success: true,
      data: {},
    });
  });
});
