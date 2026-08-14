import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

const deleteBoard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/delete-board", () => ({
  deleteBoard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { BoardOptions } from "./board-options";

describe("BoardOptions", () => {
  test("deletes the board with the given id", async () => {
    deleteBoard.mockResolvedValue({ data: { id: "board_1" } });
    const user = userEvent.setup();

    render(<BoardOptions id="board_1" />);

    await user.click(screen.getByRole("button", { name: "Board actions" }));
    await user.click(
      await screen.findByRole("button", { name: "Delete this board" }),
    );

    await waitFor(() => {
      expect(deleteBoard).toHaveBeenCalledExactlyOnceWith({ id: "board_1" });
    });
  });

  test("names the menu trigger and close control", async () => {
    const user = userEvent.setup();

    render(<BoardOptions id="board_1" />);

    await user.click(screen.getByRole("button", { name: "Board actions" }));

    expect(
      await screen.findByRole("button", { name: "Close board actions" }),
    ).toBeInTheDocument();
  });

  test("toasts when delete fails", async () => {
    deleteBoard.mockResolvedValue({ serverError: "Failed to delete board" });
    const user = userEvent.setup();

    render(<BoardOptions id="board_1" />);

    await user.click(screen.getByRole("button", { name: "Board actions" }));
    await user.click(
      await screen.findByRole("button", { name: "Delete this board" }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Failed to delete board",
      });
    });
  });
});
