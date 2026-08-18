import { describe, expect, test } from "vitest";

import { cardOrderTransactionTimeoutMs } from "./transaction-timeout";

describe("cardOrderTransactionTimeoutMs", () => {
  test("uses Prisma's 5s interactive default for short lists", () => {
    expect(cardOrderTransactionTimeoutMs(0)).toBe(5_000);
    expect(cardOrderTransactionTimeoutMs(1)).toBe(5_000);
    expect(cardOrderTransactionTimeoutMs(16)).toBe(5_000);
  });

  test("grows with the sequential update count past the default", () => {
    expect(cardOrderTransactionTimeoutMs(17)).toBe(5_250);
    expect(cardOrderTransactionTimeoutMs(40)).toBe(11_000);
  });

  test("caps the budget so a huge payload cannot run unbounded", () => {
    expect(cardOrderTransactionTimeoutMs(1_000)).toBe(60_000);
  });
});
