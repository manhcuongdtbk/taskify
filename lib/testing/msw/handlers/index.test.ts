import { describe, expect, test } from "vitest";

import { handlers } from ".";

describe("msw handlers", () => {
  test("starts with an empty default handler list", () => {
    expect(handlers).toStrictEqual([]);
  });
});
