import { describe, expect, test } from "vitest";

import { handlers } from "./handlers";

describe("msw handlers", () => {
  test("starts with an empty default handler list", () => {
    expect(handlers).toStrictEqual([]);
  });
});
