import { afterEach, describe, expect, test, vi } from "vitest";

import { stillPending } from "./still-pending";

describe("stillPending", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves to pending when the promise has not settled", async () => {
    vi.useFakeTimers();
    const hung = new Promise<never>(() => {});

    const result = stillPending(hung);
    await vi.advanceTimersByTimeAsync(50);

    await expect(result).resolves.toBe("pending");
  });

  test("resolves to fulfilled when the promise fulfills first", async () => {
    await expect(stillPending(Promise.resolve())).resolves.toBe("fulfilled");
  });

  test("rejects when the promise rejects first", async () => {
    await expect(
      stillPending(Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");
  });
});
