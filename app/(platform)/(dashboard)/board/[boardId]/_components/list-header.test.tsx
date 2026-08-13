import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  listWithCardsOrderedByOrderAscFactory,
  rewindListWithCardsOrderedByOrderAscFactory,
} from "@/lib/testing/factories/list";

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

describe("ListHeader", () => {
  beforeEach(() => {
    rewindListWithCardsOrderedByOrderAscFactory();
  });

  test("submits a changed title to updateList", async () => {
    const list = listWithCardsOrderedByOrderAscFactory.build();
    updateList.mockResolvedValue({
      data: { id: list.id, title: "Done" },
    });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText(list.title));
    const input = screen.getByDisplayValue(list.title);
    await user.clear(input);
    await user.type(input, "Done");
    await user.tab();

    await waitFor(() => {
      expect(updateList).toHaveBeenCalledExactlyOnceWith({
        id: list.id,
        title: "Done",
        boardId: list.boardId,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Renamed to "Done"',
    });
  });

  test("does not execute when the title is unchanged", async () => {
    const list = listWithCardsOrderedByOrderAscFactory.build();
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText(list.title));
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByDisplayValue(list.title)).not.toBeInTheDocument();
    });
    expect(updateList).not.toHaveBeenCalled();
  });

  test("toasts when update fails", async () => {
    const list = listWithCardsOrderedByOrderAscFactory.build();
    updateList.mockResolvedValue({ serverError: "Rename failed" });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText(list.title));
    const input = screen.getByDisplayValue(list.title);
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
    const list = listWithCardsOrderedByOrderAscFactory.build();
    updateList.mockResolvedValue({
      data: { id: list.id, title: "Done" },
    });
    const user = userEvent.setup();

    render(<ListHeader data={list} onAddCard={vi.fn()} />);

    await user.click(screen.getByText(list.title));
    const input = screen.getByDisplayValue(list.title);
    await user.clear(input);
    await user.type(input, "Done");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(updateList).toHaveBeenCalledExactlyOnceWith({
        id: list.id,
        title: "Done",
        boardId: list.boardId,
      });
    });
  });
});
