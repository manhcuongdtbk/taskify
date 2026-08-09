import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentRef, RefObject } from "react";
import { describe, expect, test, vi } from "vitest";

const useFormStatusMock = vi.hoisted(() => vi.fn(() => ({ pending: false })));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

import { FormTextarea } from "./form-textarea";

describe("FormTextarea", () => {
  test("renders label, name, id, and default value", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormTextarea
          id="description"
          label="Description"
          defaultValue="Details"
        />
      </form>,
    );

    const textarea = screen.getByLabelText("Description");

    expect(textarea).toHaveAttribute("id", "description");
    expect(textarea).toHaveAttribute("name", "description");
    expect(textarea).toHaveValue("Details");
  });

  test("renders without a label when label is omitted", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormTextarea id="description" />
      </form>,
    );

    const textarea = screen.getByRole("textbox");

    expect(textarea).toHaveAttribute("id", "description");
    // Optional label → no <Label>; assert missing accessible name, not a hard-coded string we never passed.
    expect(textarea).not.toHaveAccessibleName();
  });

  test("renders field errors", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormTextarea
          id="description"
          label="Description"
          errors={{ description: ["Description is required"] }}
        />
      </form>,
    );

    expect(screen.getByText("Description is required")).toBeInTheDocument();
  });

  test("forwards placeholder, required, and className", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormTextarea
          id="description"
          label="Description"
          placeholder="Add details"
          required
          className="custom-textarea"
        />
      </form>,
    );

    const textarea = screen.getByLabelText("Description");

    expect(textarea).toHaveAttribute("placeholder", "Add details");
    expect(textarea).toBeRequired();
    expect(textarea).toHaveClass("custom-textarea");
  });

  test("disables when pending or disabled", () => {
    useFormStatusMock.mockReturnValue({ pending: true });

    const { rerender } = render(
      <form>
        <FormTextarea id="description" label="Description" />
      </form>,
    );

    expect(screen.getByLabelText("Description")).toBeDisabled();

    useFormStatusMock.mockReturnValue({ pending: false });
    rerender(
      <form>
        <FormTextarea id="description" label="Description" disabled />
      </form>,
    );

    expect(screen.getByLabelText("Description")).toBeDisabled();
  });

  test("calls onClick, onBlur, and onKeyDown handlers", async () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();

    render(
      <form>
        <FormTextarea
          id="description"
          label="Description"
          onClick={onClick}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </form>,
    );

    const textarea = screen.getByLabelText("Description");
    await user.click(textarea);
    await user.keyboard("a");
    await user.tab();

    expect(onClick).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  test("forwards ref to the underlying textarea", () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    // Same `{ current }` shape as `useRef` in app code (tests sit outside a component).
    const ref: RefObject<ComponentRef<"textarea"> | null> = { current: null };

    render(
      <form>
        <FormTextarea id="description" label="Description" ref={ref} />
      </form>,
    );

    expect(ref.current).toBe(screen.getByLabelText("Description"));
  });
});
