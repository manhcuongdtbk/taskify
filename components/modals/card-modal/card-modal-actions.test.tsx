import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { cardWithListFactory } from "@/lib/testing/factories/card";
import { useCardModalStore } from "@/stores/use-card-modal-store";

const copyCard = vi.hoisted(() => vi.fn());
const deleteCard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/copy-card", () => ({
  copyCard,
}));

vi.mock("@/actions/delete-card", () => ({
  deleteCard,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ boardId: "board_1" }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { CardModalActions } from "./card-modal-actions";

const card = cardWithListFactory.build();

describe("CardModalActions", () => {
  beforeEach(() => {
    useCardModalStore.getState().open("card_1");
  });

  test("copies the card, toasts, and closes the modal", async () => {
    copyCard.mockResolvedValue({ data: { id: "card_1" } });
    const user = userEvent.setup();

    render(<CardModalActions data={card} />);
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(copyCard).toHaveBeenCalledExactlyOnceWith({
        id: "card_1",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Card "Ship P2" copied',
    });
    expect(useCardModalStore.getState().id).toBeUndefined();
  });

  test("toasts when copy fails", async () => {
    copyCard.mockResolvedValue({ serverError: "Copy failed" });
    const user = userEvent.setup();

    render(<CardModalActions data={card} />);
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Copy failed",
      });
    });
  });

  test("deletes the card, toasts, and closes the modal", async () => {
    deleteCard.mockResolvedValue({ data: { id: "card_1" } });
    const user = userEvent.setup();

    render(<CardModalActions data={card} />);
    await user.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(deleteCard).toHaveBeenCalledExactlyOnceWith({
        id: "card_1",
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Card "Ship P2" deleted',
    });
    expect(useCardModalStore.getState().id).toBeUndefined();
  });

  test("toasts when delete fails", async () => {
    deleteCard.mockResolvedValue({ serverError: "Delete failed" });
    const user = userEvent.setup();

    render(<CardModalActions data={card} />);
    await user.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Delete failed",
      });
    });
  });

  test("renders the actions skeleton", () => {
    render(<CardModalActions.Skeleton />);

    expect(
      screen.getByRole("status", { name: /loading actions/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Copy/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Delete/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });
});
