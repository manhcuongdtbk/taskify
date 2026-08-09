import { describe, expect, test } from "vitest";

import { unsplashGetNetworkError } from "./get-mock-result";

describe("unsplashGetNetworkError", () => {
  test("is the network-failure payload FormPicker treats as empty", () => {
    expect(unsplashGetNetworkError).toStrictEqual({
      data: null,
      error: "network",
    });
  });
});
