import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { boardFactory } from "@/lib/testing/factories/board";

const updateBoard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/update-board", () => ({
  updateBoard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { BoardTitleForm } from "./board-title-form";

describe("BoardTitleForm", () => {
  test("renames the board title on success", async () => {
    const board = boardFactory.build();
    const updatedBoard = { ...board, title: "Updated title" };
    updateBoard.mockResolvedValue({ data: updatedBoard });
    const user = userEvent.setup();

    render(<BoardTitleForm board={board} />);

    await user.click(screen.getByRole("button", { name: board.title }));
    const input = screen.getByDisplayValue(board.title);
    await user.clear(input);
    await user.type(input, updatedBoard.title);
    await user.tab();

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalledExactlyOnceWith({
        id: board.id,
        title: updatedBoard.title,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `Board "${updatedBoard.title}" updated`,
    });
    // Confirmed local mirror: UI must show Action `data.title`, not stale
    // `useState` / props — see docs/data.md (Client mirrors after Server Actions).
    expect(
      await screen.findByRole("button", { name: updatedBoard.title }),
    ).toBeInTheDocument();
  });

  test("toasts when update fails", async () => {
    const board = boardFactory.build();
    updateBoard.mockResolvedValue({ serverError: "Update failed" });
    const user = userEvent.setup();

    render(<BoardTitleForm board={board} />);

    await user.click(screen.getByRole("button", { name: board.title }));
    await user.tab();

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Update failed",
      });
    });
  });
});
