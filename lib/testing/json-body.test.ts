import { describe, expect, test } from "vitest";

import { jsonBody } from "./json-body";

describe("jsonBody", () => {
  test("maps Date fields to JSON ISO strings", () => {
    const iso = "2020-01-01T06:15:00.123Z";

    expect(jsonBody({ createdAt: new Date(iso) })).toStrictEqual({
      createdAt: iso,
    });
  });

  test("round-trips nested arrays", () => {
    const iso = "2020-01-01T06:15:00.123Z";

    expect(
      jsonBody([{ id: "auditLog_1", createdAt: new Date(iso) }]),
    ).toStrictEqual([{ id: "auditLog_1", createdAt: iso }]);
  });
});
