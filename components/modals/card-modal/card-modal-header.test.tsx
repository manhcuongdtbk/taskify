import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";

import type { CardWithList } from "@/types";
import { cardQueries } from "@/lib/api/card";

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
} as CardWithList;

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  return {
    invalidateQueries,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

describe("CardModalHeader", () => {
  beforeEach(() => {
    updateCard.mockReset();
    toastAdd.mockReset();
  });

  test("submits a changed title to updateCard", async () => {
    updateCard.mockResolvedValue({ data: { id: "card_1", title: "Renamed" } });
    const user = userEvent.setup();
    const { invalidateQueries } = renderWithQuery(
      <CardModalHeader data={card} />,
    );

    const input = screen.getByDisplayValue("Ship P2");
    await user.clear(input);
    await user.type(input, "Renamed");
    await user.tab();

    await waitFor(() => {
      expect(updateCard).toHaveBeenCalledExactlyOnceWith({
        title: "Renamed",
        boardId: "board_1",
        id: "card_1",
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Renamed to Renamed",
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: cardQueries.byId("card_1"),
    });
  });

  test("does not execute when the title is unchanged", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CardModalHeader data={card} />);

    await user.click(screen.getByDisplayValue("Ship P2"));
    await user.tab();

    expect(updateCard).not.toHaveBeenCalled();
  });

  test("toasts when update fails", async () => {
    updateCard.mockResolvedValue({ serverError: "Rename failed" });
    const user = userEvent.setup();
    renderWithQuery(<CardModalHeader data={card} />);

    const input = screen.getByDisplayValue("Ship P2");
    await user.clear(input);
    await user.type(input, "Renamed");
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

    expect(screen.queryByText(/in list/i)).not.toBeInTheDocument();
  });

  test("shows the list title", () => {
    renderWithQuery(<CardModalHeader data={card} />);

    expect(screen.getByText("Todo")).toBeInTheDocument();
  });
});
