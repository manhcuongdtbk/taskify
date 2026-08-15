import { parseISO } from "date-fns";
import { describe, expect, test } from "vitest";

import { JsonIsoDateTimeSchema } from "./json-iso-date-time";

describe("JsonIsoDateTimeSchema", () => {
  test("maps a JSON ISO datetime to a Date", () => {
    const iso = "2020-01-01T06:15:00.123Z";

    expect(JsonIsoDateTimeSchema.parse(iso)).toStrictEqual(parseISO(iso));
  });

  test("maps an ISO datetime with a numeric offset to a Date", () => {
    const iso = "2020-01-01T06:15:00+00:00";

    expect(JsonIsoDateTimeSchema.parse(iso)).toStrictEqual(parseISO(iso));
  });

  test("rejects a non-datetime string", () => {
    expect(() => JsonIsoDateTimeSchema.parse("not-a-datetime")).toThrow();
  });
});
