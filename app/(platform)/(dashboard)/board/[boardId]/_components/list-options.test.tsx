import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { listFactory, rewindListFactory } from "@/lib/testing/factories/list";

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

describe("ListOptions", () => {
  beforeEach(() => {
    rewindListFactory();
  });

  test("copies the list with id and boardId", async () => {
    const list = listFactory.build();
    copyList.mockResolvedValue({
      data: { id: "list_2", title: list.title },
    });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Copy list..." }),
    );

    await waitFor(() => {
      expect(copyList).toHaveBeenCalledExactlyOnceWith({
        id: list.id,
        boardId: list.boardId,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `List "${list.title}" copied`,
    });
  });

  test("deletes the list with id and boardId", async () => {
    const list = listFactory.build();
    deleteList.mockResolvedValue({
      data: { id: list.id, title: list.title },
    });
    const user = userEvent.setup();

    render(<ListOptions data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(
      await screen.findByRole("button", { name: "Delete list..." }),
    );

    await waitFor(() => {
      expect(deleteList).toHaveBeenCalledExactlyOnceWith({
        id: list.id,
        boardId: list.boardId,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `List "${list.title}" deleted`,
    });
  });

  test("calls onAddCard when Add card is clicked", async () => {
    const list = listFactory.build();
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
    const list = listFactory.build();
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
    const list = listFactory.build();
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
