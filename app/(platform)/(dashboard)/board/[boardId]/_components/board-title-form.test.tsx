import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const updateBoard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/update-board", () => ({
  updateBoard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { BoardTitleForm } from "./board-title-form";

const board = {
  id: "board_1",
  title: "Old title",
  orgId: "org_1",
  imageId: "img",
  imageThumbUrl: "https://example.com/t",
  imageFullUrl: "https://example.com/f",
  imageUserName: "Ada",
  imageLinkHTML: "https://example.com",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("BoardTitleForm", () => {
  beforeEach(() => {
    updateBoard.mockReset();
    toastAdd.mockReset();
  });

  test("renames the board title on success", async () => {
    updateBoard.mockResolvedValue({
      data: { ...board, title: "Roadmap" },
    });
    const user = userEvent.setup();

    render(<BoardTitleForm data={board} />);

    await user.click(screen.getByRole("button", { name: "Old title" }));
    const input = screen.getByDisplayValue("Old title");
    await user.clear(input);
    await user.type(input, "Roadmap");
    await user.tab();

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalledExactlyOnceWith({
        id: "board_1",
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
    updateBoard.mockResolvedValue({ serverError: "Update failed" });
    const user = userEvent.setup();

    render(<BoardTitleForm data={board} />);

    await user.click(screen.getByRole("button", { name: "Old title" }));
    await user.tab();

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Update failed",
      });
    });
  });
});
