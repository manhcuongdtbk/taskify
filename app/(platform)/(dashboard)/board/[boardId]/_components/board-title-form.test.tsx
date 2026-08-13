import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  boardFactory,
  rewindBoardFactory,
} from "@/lib/testing/factories/board";

const updateBoard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/update-board", () => ({
  updateBoard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { BoardTitleForm } from "./board-title-form";

const boardRow = () => boardFactory.build({ title: "Old title" });

describe("BoardTitleForm", () => {
  beforeEach(() => {
    rewindBoardFactory();
  });

  test("renames the board title on success", async () => {
    const board = boardRow();
    updateBoard.mockResolvedValue({
      data: { ...board, title: "Roadmap" },
    });
    const user = userEvent.setup();

    render(<BoardTitleForm data={board} />);

    await user.click(screen.getByRole("button", { name: board.title }));
    const input = screen.getByDisplayValue(board.title);
    await user.clear(input);
    await user.type(input, "Roadmap");
    await user.tab();

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalledExactlyOnceWith({
        id: board.id,
        title: "Roadmap",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Board "Roadmap" updated',
    });
    // Confirmed local mirror: UI must show Action `data.title`, not stale
    // `useState` / props — see docs/data.md (Client mirrors after Server Actions).
    expect(
      await screen.findByRole("button", { name: "Roadmap" }),
    ).toBeInTheDocument();
  });

  test("toasts when update fails", async () => {
    const board = boardRow();
    updateBoard.mockResolvedValue({ serverError: "Update failed" });
    const user = userEvent.setup();

    render(<BoardTitleForm data={board} />);

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
