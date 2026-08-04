import { describe, expect, test, vi } from "vitest";
import { dinero } from "dinero.js";
import { EUR, USD } from "dinero.js/currencies";

vi.mock("stripe", () => ({
  default: class Stripe {
    constructor() {
      // Avoid needing STRIPE_SECRET_KEY when importing helpers under test.
    }
  },
}));

import {
  stripeTimestampToDate,
  toStripeCurrency,
  toStripeUnitAmount,
} from "./stripe";

describe("stripeTimestampToDate", () => {
  test("converts Unix seconds to a Date", () => {
    expect(stripeTimestampToDate(1_700_000_000)).toEqual(
      new Date("2023-11-14T22:13:20.000Z"),
    );
  });
});

describe("toStripeUnitAmount", () => {
  test("returns Dinero minor units for Stripe unit_amount", () => {
    const money = dinero({ amount: 2000, currency: USD });

    expect(toStripeUnitAmount(money)).toBe(2000);
  });
});

describe("toStripeCurrency", () => {
  test.for([
    { currency: USD, expected: "usd" },
    { currency: EUR, expected: "eur" },
  ])("lowercases $expected", ({ currency, expected }) => {
    const money = dinero({ amount: 100, currency });

    expect(toStripeCurrency(money)).toBe(expected);
  });
});
