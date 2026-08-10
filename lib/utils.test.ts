import { describe, expect, test, vi } from "vitest";

import { absoluteUrl, cn, cssUrl } from "./utils";

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
  test("prefixes path with NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");

    expect(absoluteUrl("/board/1")).toBe("https://app.example/board/1");
  });
});

describe("cssUrl", () => {
  test("quotes the URL for CSS url()", () => {
    expect(cssUrl("https://images.unsplash.com/photo.jpg")).toBe(
      'url("https://images.unsplash.com/photo.jpg")',
    );
  });

  test("escapes quotes so a value cannot break out of url()", () => {
    expect(
      cssUrl('https://evil.example/x.jpg");color:red;background:url("y'),
    ).toBe(
      'url("https://evil.example/x.jpg\\");color:red;background:url(\\"y")',
    );
  });
});
