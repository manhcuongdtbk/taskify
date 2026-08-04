import { afterEach, describe, expect, test, vi } from "vitest";

import { absoluteUrl, cn } from "./utils";

describe("cn", () => {
  test("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  test("dedupes conflicting Tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  test("ignores falsy values", () => {
    expect(cn("block", false && "hidden", null, undefined, "text-sm")).toBe(
      "block text-sm",
    );
  });
});

describe("absoluteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("prefixes path with NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://taskify.example");

    expect(absoluteUrl("/board/1")).toBe("https://taskify.example/board/1");
  });
});
