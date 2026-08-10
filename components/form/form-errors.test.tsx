import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FormErrors } from "./form-errors";

describe("FormErrors", () => {
  test("renders nothing when errors are missing", () => {
    const { container } = render(<FormErrors id="title" />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when the field has an empty message list", () => {
    const { container } = render(
      <FormErrors id="title" errors={{ title: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when another field has errors", () => {
    const { container } = render(
      <FormErrors id="title" errors={{ image: ["Missing Image"] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("renders field messages with aria-live polite", () => {
    render(
      <FormErrors
        id="title"
        errors={{ title: ["Title is required", "Title is too short"] }}
      />,
    );

    const region = screen.getByRole("status");

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("id", "title-error");
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Title is too short")).toBeInTheDocument();
  });
});
