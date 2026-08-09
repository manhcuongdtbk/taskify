import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { cardQueries } from "@/lib/api/card";
import { renderWithQuery } from "@/lib/testing/tanstack-query/render-with-query";

const updateCard = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/update-card", () => ({
  updateCard,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ boardId: "board_1" }),
}));

import { CardModalDescription } from "./card-modal-description";

const card = {
  id: "card_1",
  title: "Ship P2",
  description: null,
  order: 0,
  listId: "list_1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  list: {
    id: "list_1",
    title: "Todo",
    order: 0,
    boardId: "board_1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
};

describe("CardModalDescription", () => {
  beforeEach(() => {
    updateCard.mockReset();
    toastAdd.mockReset();
  });

  test("submits description to updateCard", async () => {
    updateCard.mockResolvedValue({
      data: { id: "card_1", title: "Ship P2", description: "Details" },
    });
    const user = userEvent.setup();
    const { invalidateQueries } = renderWithQuery(
      <CardModalDescription data={card} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    );
    await user.type(
      screen.getByPlaceholderText("Add a more detailed description"),
      "Details",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledExactlyOnceWith({
        boardId: "board_1",
        id: "card_1",
        description: "Details",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: 'Card "Ship P2" updated',
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: cardQueries.byId("card_1"),
    });
  });

  test("toasts when update fails", async () => {
    updateCard.mockResolvedValue({ serverError: "Update failed" });
    const user = userEvent.setup();
    renderWithQuery(<CardModalDescription data={card} />);

    await user.click(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    );
    await user.type(
      screen.getByPlaceholderText("Add a more detailed description"),
      "Details",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Update failed",
      });
    });
  });

  test("cancels editing", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CardModalDescription data={card} />);

    await user.click(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    ).toBeInTheDocument();
  });

  test("closes editing on Escape", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CardModalDescription data={card} />);

    await user.click(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    );
    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", {
        name: "Add a more detailed description...",
      }),
    ).toBeInTheDocument();
  });

  test("renders existing description text", () => {
    renderWithQuery(
      <CardModalDescription
        data={{ ...card, description: "Existing details" }}
      />,
    );

    expect(screen.getByText("Existing details")).toBeInTheDocument();
  });

  test("renders the description skeleton", () => {
    render(<CardModalDescription.Skeleton />);

    expect(
      screen.getByRole("status", { name: /loading description/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });
});
