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
