import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
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

describe("CardModalActions", () => {
  test("copies the card, toasts, and closes the modal", async () => {
    const card = cardWithListTitleFactory.build();
    useCardModalStore.getState().open(card.id);
    copyCard.mockResolvedValue({ data: { id: card.id } });
    const user = userEvent.setup();

    render(<CardModalActions card={card} />);
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(copyCard).toHaveBeenCalledExactlyOnceWith({
        id: card.id,
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `Card "${card.title}" copied`,
    });
    expect(useCardModalStore.getState().id).toBeUndefined();
  });

  test("toasts when copy fails", async () => {
    const card = cardWithListTitleFactory.build();
    useCardModalStore.getState().open(card.id);
    copyCard.mockResolvedValue({ serverError: "Copy failed" });
    const user = userEvent.setup();

    render(<CardModalActions card={card} />);
    await user.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Copy failed",
      });
    });
  });

  test("deletes the card, toasts, and closes the modal", async () => {
    const card = cardWithListTitleFactory.build();
    useCardModalStore.getState().open(card.id);
    deleteCard.mockResolvedValue({ data: { id: card.id } });
    const user = userEvent.setup();

    render(<CardModalActions card={card} />);
    await user.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(deleteCard).toHaveBeenCalledExactlyOnceWith({
        id: card.id,
        boardId: "board_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `Card "${card.title}" deleted`,
    });
    expect(useCardModalStore.getState().id).toBeUndefined();
  });

  test("toasts when delete fails", async () => {
    const card = cardWithListTitleFactory.build();
    useCardModalStore.getState().open(card.id);
    deleteCard.mockResolvedValue({ serverError: "Delete failed" });
    const user = userEvent.setup();

    render(<CardModalActions card={card} />);
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
