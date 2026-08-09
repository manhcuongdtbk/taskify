import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

const useFormStatusMock = vi.hoisted(() => vi.fn(() => ({ pending: false })));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

import { FormInput } from "./form-input";

describe("FormInput", () => {
  test("renders label, name, id, and default value", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormInput id="title" label="Board title" defaultValue="Roadmap" />
      </form>,
    );

    const input = screen.getByLabelText("Board title");

    expect(input).toHaveAttribute("id", "title");
    expect(input).toHaveAttribute("name", "title");
    expect(input).toHaveValue("Roadmap");
  });

  test("renders without a label when label is omitted", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormInput id="title" />
      </form>,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("id", "title");
    expect(screen.queryByText("Board title")).not.toBeInTheDocument();
  });

  test("renders field errors", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormInput
          id="title"
          label="Board title"
          errors={{ title: ["Title is required"] }}
        />
      </form>,
    );

    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  test("forwards type, placeholder, required, and className", () => {
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormInput
          id="title"
          label="Board title"
          type="email"
          placeholder="Enter title"
          required
          className="custom-input"
        />
      </form>,
    );

    const input = screen.getByLabelText("Board title");

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "Enter title");
    expect(input).toBeRequired();
    expect(input).toHaveClass("custom-input");
  });

  test("disables when pending or disabled", () => {
    useFormStatusMock.mockReturnValue({ pending: true });

    const { rerender } = render(
      <form>
        <FormInput id="title" label="Board title" />
      </form>,
    );

    expect(screen.getByLabelText("Board title")).toBeDisabled();

    useFormStatusMock.mockReturnValue({ pending: false });
    rerender(
      <form>
        <FormInput id="title" label="Board title" disabled />
      </form>,
    );

    expect(screen.getByLabelText("Board title")).toBeDisabled();
  });

  test("supports controlled value and onChange", async () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <form>
        <FormInput
          id="title"
          label="Board title"
          value="Road"
          onChange={onChange}
        />
      </form>,
    );

    const input = screen.getByLabelText("Board title");

    expect(input).toHaveValue("Road");

    await user.type(input, "m");

    expect(onChange).toHaveBeenCalled();
  });

  test("calls onBlur when the input blurs", async () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    const user = userEvent.setup();
    const onBlur = vi.fn();

    render(
      <form>
        <FormInput id="title" label="Board title" onBlur={onBlur} />
      </form>,
    );

    const input = screen.getByLabelText("Board title");
    await user.click(input);
    await user.tab();

    expect(onBlur).toHaveBeenCalledOnce();
  });
});
