import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const useFormStatusMock = vi.hoisted(() => vi.fn(() => ({ pending: false })));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

import { FormSubmit } from "./form-submit";

describe("FormSubmit", () => {
  test("renders a submit button with children", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormSubmit>Create</FormSubmit>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  test("forwards className and variant to the button", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormSubmit className="w-full" variant="ghost">
          Create
        </FormSubmit>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Create" });

    expect(button).toHaveClass("w-full");
    expect(button).toHaveClass("hover:bg-muted");
  });

  test("disables when the disabled prop is true", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormSubmit disabled>Create</FormSubmit>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  test("disables when the form status is pending", () => {
    useFormStatusMock.mockReturnValue({ pending: true });

    render(
      <form>
        <FormSubmit>Create</FormSubmit>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });
});
