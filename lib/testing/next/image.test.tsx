import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import NextImageMock from "./image";

describe("NextImageMock", () => {
  test("renders an img with string src", () => {
    render(<NextImageMock alt="Hero" src="/hero.svg" />);

    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute(
      "src",
      "/hero.svg",
    );
  });

  test("omits src when it is not a string", () => {
    render(<NextImageMock alt="Hero" src={{ src: "/static.png" }} />);

    expect(screen.getByRole("img", { name: "Hero" })).not.toHaveAttribute(
      "src",
    );
  });
});
