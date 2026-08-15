import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { cardQueries } from "@/lib/tanstack-query/resources/card";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
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

import { CardModalHeader } from "./card-modal-header";

describe("CardModalHeader", () => {
  test("submits a changed title to updateCard", async () => {
    const card = cardWithListTitleFactory.build();
    const updatedCard = { ...card, title: "Renamed" };
    updateCard.mockResolvedValue({ data: updatedCard });
    const user = userEvent.setup();
    const { invalidateQueries } = renderWithQuery(
      <CardModalHeader card={card} />,
    );

    const input = screen.getByDisplayValue(card.title);
    await user.clear(input);
    await user.type(input, updatedCard.title);
    await user.tab();

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledExactlyOnceWith({
        title: updatedCard.title,
        boardId: "board_1",
        id: card.id,
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: `Renamed to ${updatedCard.title}`,
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: cardQueries.byId(card.id),
    });
  });

  test("does not execute when the title is unchanged", async () => {
    const card = cardWithListTitleFactory.build();
    const user = userEvent.setup();
    renderWithQuery(<CardModalHeader card={card} />);

    await user.click(screen.getByDisplayValue(card.title));
    await user.tab();

    expect(updateCard).not.toHaveBeenCalled();
  });

  test("toasts when update fails", async () => {
    const card = cardWithListTitleFactory.build();
    const updatedCard = { ...card, title: "Renamed" };
    updateCard.mockResolvedValue({ serverError: "Rename failed" });
    const user = userEvent.setup();
    renderWithQuery(<CardModalHeader card={card} />);

    const input = screen.getByDisplayValue(card.title);
    await user.clear(input);
    await user.type(input, updatedCard.title);
    await user.tab();

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Rename failed",
      });
    });
  });

  test("renders the header skeleton", () => {
    render(<CardModalHeader.Skeleton />);

    expect(
      screen.getByRole("status", { name: /loading card header/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/in list/i)).not.toBeInTheDocument();
  });

  test("shows the list title", () => {
    const card = cardWithListTitleFactory.build();
    renderWithQuery(<CardModalHeader card={card} />);

    expect(screen.getByText(card.list.title)).toBeInTheDocument();
  });
});
