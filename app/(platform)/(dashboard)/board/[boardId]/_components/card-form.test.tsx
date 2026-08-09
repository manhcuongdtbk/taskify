import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const createCard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/create-card", () => ({
  createCard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ boardId: "board_1" }),
}));

import { CardForm } from "./card-form";

describe("CardForm", () => {
  beforeEach(() => {
    createCard.mockReset();
    toastAdd.mockReset();
  });

  test("submits title, boardId, and listId to createCard", async () => {
    createCard.mockResolvedValue({
      data: { id: "card_1", title: "Ship P2" },
    });
    const user = userEvent.setup();

    render(
      <CardForm
        listId="list_1"
        isEditing
        onEnableEditing={vi.fn()}
        onDisableEditing={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Enter a title for this card..."),
      "Ship P2",
    );
    await user.click(screen.getByRole("button", { name: "Add card" }));

    await waitFor(() => {
      expect(createCard).toHaveBeenCalledExactlyOnceWith({
        title: "Ship P2",
        boardId: "board_1",
        listId: "list_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Card "Ship P2" created',
    });
  });

  test("toasts when create fails", async () => {
    createCard.mockResolvedValue({ serverError: "Create failed" });
    const user = userEvent.setup();

    render(
      <CardForm
        listId="list_1"
        isEditing
        onEnableEditing={vi.fn()}
        onDisableEditing={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Enter a title for this card..."),
      "Ship P2",
    );
    await user.click(screen.getByRole("button", { name: "Add card" }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Create failed",
      });
    });
  });

  test("calls onEnableEditing from the collapsed button", async () => {
    const onEnableEditing = vi.fn();
    const user = userEvent.setup();

    render(
      <CardForm
        listId="list_1"
        isEditing={false}
        onEnableEditing={onEnableEditing}
        onDisableEditing={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Add a card/i }));

    expect(onEnableEditing).toHaveBeenCalledOnce();
  });

  test("calls onDisableEditing on Escape while editing", async () => {
    const onDisableEditing = vi.fn();
    const user = userEvent.setup();

    render(
      <CardForm
        listId="list_1"
        isEditing
        onEnableEditing={vi.fn()}
        onDisableEditing={onDisableEditing}
      />,
    );

    await user.keyboard("{Escape}");

    expect(onDisableEditing).toHaveBeenCalledOnce();
  });

  test("submits on Enter without Shift in the textarea", async () => {
    createCard.mockResolvedValue({
      data: { id: "card_1", title: "Ship P2" },
    });
    const user = userEvent.setup();

    render(
      <CardForm
        listId="list_1"
        isEditing
        onEnableEditing={vi.fn()}
        onDisableEditing={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      "Enter a title for this card...",
    );
    await user.type(textarea, "Ship P2{Enter}");

    await waitFor(() => {
      expect(createCard).toHaveBeenCalledExactlyOnceWith({
        title: "Ship P2",
        boardId: "board_1",
        listId: "list_1",
      });
    });
  });
});
