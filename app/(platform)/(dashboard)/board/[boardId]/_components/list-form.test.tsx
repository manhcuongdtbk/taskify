import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const createList = vi.hoisted(() =>
  vi.fn(async () => ({ data: { id: "list_1", title: "Todo" } })),
);
const toastAdd = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/actions/create-list", () => ({
  createList,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ boardId: "board_1" }),
  useRouter: () => ({ refresh }),
}));

import { ListForm } from "./list-form";

describe("ListForm", () => {
  beforeEach(() => {
    createList.mockReset();
    toastAdd.mockReset();
    refresh.mockReset();
  });

  test("submits title and boardId to createList", async () => {
    createList.mockResolvedValue({ data: { id: "list_1", title: "Todo" } });
    const user = userEvent.setup();

    render(
      <ul>
        <ListForm />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: /Add a list/i }));
    await user.type(screen.getByPlaceholderText("Enter list title..."), "Todo");
    await user.click(screen.getByRole("button", { name: "Add List" }));

    await waitFor(() => {
      expect(createList).toHaveBeenCalledExactlyOnceWith({
        title: "Todo",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'List "Todo" created',
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("toasts when create fails", async () => {
    createList.mockResolvedValue({ serverError: "Create failed" });
    const user = userEvent.setup();

    render(
      <ul>
        <ListForm />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: /Add a list/i }));
    await user.type(screen.getByPlaceholderText("Enter list title..."), "Todo");
    await user.click(screen.getByRole("button", { name: "Add List" }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Create failed",
      });
    });
  });

  test("closes editing on Escape", async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <ListForm />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: /Add a list/i }));
    expect(
      screen.getByPlaceholderText("Enter list title..."),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: /Add a list/i }),
    ).toBeInTheDocument();
  });

  test("closes editing when the cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <ListForm />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: /Add a list/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("button", { name: /Add a list/i }),
    ).toBeInTheDocument();
  });
});
