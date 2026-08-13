import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseISO } from "date-fns";
import { describe, expect, test, vi } from "vitest";

const copyList = vi.hoisted(() => vi.fn());
const deleteList = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/copy-list", () => ({
  copyList,
}));

vi.mock("@/actions/delete-list", () => ({
  deleteList,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { ListOptions } from "./list-options";

const instant = parseISO("2026-01-01T00:00:00.000Z");

const list = {
  id: "list_1",
  title: "Todo",
  order: 0,
  boardId: "board_1",
  createdAt: instant,
  updatedAt: instant,
};

describe("ListOptions", () => {
  test("copies the list with id and boardId", async () => {
    copyList.mockResolvedValue({
      data: { id: "list_2", title: "Todo" },
    });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Copy list..." }),
    );

    await waitFor(() => {
      expect(copyList).toHaveBeenCalledExactlyOnceWith({
        id: "list_1",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'List "Todo" copied',
    });
  });

  test("deletes the list with id and boardId", async () => {
    deleteList.mockResolvedValue({
      data: { id: "list_1", title: "Todo" },
    });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Delete list..." }),
    );

    await waitFor(() => {
      expect(deleteList).toHaveBeenCalledExactlyOnceWith({
        id: "list_1",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'List "Todo" deleted',
    });
  });

  test("calls onAddCard when Add card is clicked", async () => {
    const onAddCard = vi.fn();
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={onAddCard} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Add card..." }),
    );

    expect(onAddCard).toHaveBeenCalledOnce();
  });

  test("toasts when copy fails", async () => {
    copyList.mockResolvedValue({ serverError: "Copy failed" });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Copy list..." }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Copy failed",
      });
    });
  });

  test("toasts when delete fails", async () => {
    deleteList.mockResolvedValue({ serverError: "Delete failed" });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Delete list..." }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Delete failed",
      });
    });
  });
});
