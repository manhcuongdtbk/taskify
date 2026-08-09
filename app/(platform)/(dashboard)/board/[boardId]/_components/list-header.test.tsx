import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { ListWithCards } from "@/types";

const updateList = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/update-list", () => ({
  updateList,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("./list-options", () => ({
  ListOptions: () => <div data-testid="list-options" />,
}));

import { ListHeader } from "./list-header";

const list = {
  id: "list_1",
  title: "Todo",
  order: 0,
  boardId: "board_1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  cards: [],
} as ListWithCards;

describe("ListHeader", () => {
  beforeEach(() => {
    updateList.mockReset();
    toastAdd.mockReset();
  });

  test("submits a changed title to updateList", async () => {
    updateList.mockResolvedValue({ data: { id: "list_1", title: "Done" } });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText("Todo"));
    const input = screen.getByDisplayValue("Todo");
    await user.clear(input);
    await user.type(input, "Done");
    await user.tab();

    await waitFor(() => {
      expect(updateList).toHaveBeenCalledExactlyOnceWith({
        id: "list_1",
        title: "Done",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Renamed to "Done"',
    });
  });

  test("does not execute when the title is unchanged", async () => {
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText("Todo"));
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Todo")).not.toBeInTheDocument();
    });
    expect(updateList).not.toHaveBeenCalled();
  });

  test("toasts when update fails", async () => {
    updateList.mockResolvedValue({ serverError: "Rename failed" });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText("Todo"));
    const input = screen.getByDisplayValue("Todo");
    await user.clear(input);
    await user.type(input, "Done");
    await user.tab();

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Rename failed",
      });
    });
  });

  test("submits on Escape while editing", async () => {
    updateList.mockResolvedValue({ data: { id: "list_1", title: "Done" } });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText("Todo"));
    const input = screen.getByDisplayValue("Todo");
    await user.clear(input);
    await user.type(input, "Done");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(updateList).toHaveBeenCalledExactlyOnceWith({
        id: "list_1",
        title: "Done",
        boardId: "board_1",
      });
    });
  });
});
