import { describe, expect, test } from "vitest";

import { formDataString } from "./form-data";

describe("formDataString", () => {
  test("returns the string value for a named field", () => {
    const formData = new FormData();
    formData.set("title", "Roadmap");

    expect(formDataString(formData, "title")).toBe("Roadmap");
  });

  test("returns an empty string when the field is missing", () => {
    expect(formDataString(new FormData(), "title")).toBe("");
  });

  test("returns an empty string when the field is a File", () => {
    const formData = new FormData();
    formData.set("title", new File(["x"], "x.txt"));

    expect(formDataString(formData, "title")).toBe("");
  });
});
