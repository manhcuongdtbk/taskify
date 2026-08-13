import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { cardQueries } from "@/lib/api/card";
import {
  cardWithListTitleFactory,
  rewindCardWithListTitleFactory,
} from "@/lib/testing/factories/card";
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

describe("CardModalDescription", () => {
  beforeEach(() => {
    rewindCardWithListTitleFactory();
  });

  test("submits description to updateCard", async () => {
    const card = cardWithListTitleFactory.build();
    const updatedCard = { ...card, description: "Details" };
    updateCard.mockResolvedValue({ data: updatedCard });
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
      updatedCard.description,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledExactlyOnceWith({
        boardId: "board_1",
        id: card.id,
        description: updatedCard.description,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `Card "${card.title}" updated`,
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: cardQueries.byId(card.id),
    });
  });

  test("toasts when update fails", async () => {
    const card = cardWithListTitleFactory.build();
    const updatedCard = { ...card, description: "Details" };
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
      updatedCard.description,
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
    const card = cardWithListTitleFactory.build();
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
    const card = cardWithListTitleFactory.build();
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
    const card = cardWithListTitleFactory.build({
      description: "Existing details",
    });
    renderWithQuery(<CardModalDescription data={card} />);

    expect(screen.getByText(card.description!)).toBeInTheDocument();
  });

  test("renders the description skeleton", () => {
    render(<CardModalDescription.Skeleton />);

    expect(
      screen.getByRole("status", { name: /loading description/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });
});
