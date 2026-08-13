import { render, screen, waitFor } from "@testing-library/react";
import {
  type DroppableProvided,
  type DropResult,
  type ResponderProvided,
} from "@hello-pangea/dnd";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";
import { cardFactory } from "@/lib/testing/factories/card";
import { listWithCardsOrderedByOrderAscFactory } from "@/lib/testing/factories/list";

const onDragEndRef = vi.hoisted(() => ({
  current: null as
    null | ((result: DropResult, provided: ResponderProvided) => void),
}));

const updateListOrder = vi.hoisted(() => vi.fn());
const updateCardOrder = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({
    onDragEnd,
    children,
  }: {
    onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
    children: ReactNode;
  }) => {
    onDragEndRef.current = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  Droppable: ({
    children,
  }: {
    children: (provided: DroppableProvided) => ReactNode;
  }) =>
    children({
      innerRef: () => {},
      droppableProps: {
        "data-rfd-droppable-context-id": "test",
        "data-rfd-droppable-id": "lists",
      },
      placeholder: null,
    } as DroppableProvided),
}));

vi.mock("./list-item", () => ({
  ListItem: ({
    data,
    index,
  }: {
    data: { id: string; title: string; order: number };
    index: number;
  }) => (
    <li
      data-testid={`list-${data.id}`}
      data-order={String(data.order)}
      data-index={String(index)}
    >
      {data.title}
    </li>
  ),
}));

vi.mock("./list-form", () => ({
  ListForm: () => <div data-testid="list-form" />,
}));

vi.mock("@/actions/update-list-order", () => ({
  updateListOrder,
}));

vi.mock("@/actions/update-card-order", () => ({
  updateCardOrder,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { ListContainer } from "./list-container";

const boardId = "board_1";

function makeCard(
  id: string,
  listId: string,
  order: number,
  title = id,
): ListWithCardsOrderedByOrderAsc["cards"][number] {
  return cardFactory.build({ id, title, order, listId });
}

function makeList(
  id: string,
  order: number,
  cards: ListWithCardsOrderedByOrderAsc["cards"] = [],
): ListWithCardsOrderedByOrderAsc {
  return listWithCardsOrderedByOrderAscFactory.build(
    { id, title: id, order, boardId },
    { associations: { cards } },
  );
}

function dropResult(
  partial: Pick<DropResult, "type" | "source" | "destination">,
): DropResult {
  return {
    draggableId: "drag",
    mode: "FLUID",
    reason: "DROP",
    combine: null,
    ...partial,
  };
}

function fireDragEnd(result: DropResult) {
  expect(onDragEndRef.current).not.toBeNull();
  onDragEndRef.current?.(result, {} as ResponderProvided);
}

describe("ListContainer", () => {
  test("renders lists from props", () => {
    const data = [makeList("list_a", 0), makeList("list_b", 1)];

    render(<ListContainer boardId={boardId} data={data} />);

    expect(screen.getByTestId("list-list_a")).toHaveAttribute(
      "data-order",
      "0",
    );
    expect(screen.getByTestId("list-list_b")).toHaveAttribute(
      "data-order",
      "1",
    );
    expect(screen.getByTestId("list-form")).toBeInTheDocument();
  });

  test("syncs ordered lists when props data changes", () => {
    const initial = [makeList("list_a", 0)];
    const { rerender } = render(
      <ListContainer boardId={boardId} data={initial} />,
    );

    expect(screen.getByTestId("list-list_a")).toBeInTheDocument();

    rerender(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0), makeList("list_b", 1)]}
      />,
    );

    expect(screen.getByTestId("list-list_b")).toBeInTheDocument();
  });

  test("does nothing when there is no destination", () => {
    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0), makeList("list_b", 1)]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "list",
        source: { droppableId: "lists", index: 0 },
        destination: null,
      }),
    );

    expect(updateListOrder).not.toHaveBeenCalled();
    expect(updateCardOrder).not.toHaveBeenCalled();
  });

  test("does nothing when dropped in the same position", () => {
    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0), makeList("list_b", 1)]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "list",
        source: { droppableId: "lists", index: 1 },
        destination: { droppableId: "lists", index: 1 },
      }),
    );

    expect(updateListOrder).not.toHaveBeenCalled();
  });

  test("reorders lists and executes updateListOrder", async () => {
    updateListOrder.mockResolvedValue({
      data: [{ id: "list_b" }, { id: "list_a" }],
    });

    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0), makeList("list_b", 1)]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "list",
        source: { droppableId: "lists", index: 0 },
        destination: { droppableId: "lists", index: 1 },
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("list-list_b")).toHaveAttribute(
        "data-index",
        "0",
      );
      expect(screen.getByTestId("list-list_a")).toHaveAttribute(
        "data-index",
        "1",
      );
    });

    await waitFor(() => {
      expect(updateListOrder).toHaveBeenCalledExactlyOnceWith({
        boardId,
        items: [
          expect.objectContaining({ id: "list_b", order: 0 }),
          expect.objectContaining({ id: "list_a", order: 1 }),
        ],
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "List reordered",
    });
  });

  test("toasts when list reorder fails", async () => {
    updateListOrder.mockResolvedValue({ serverError: "List order failed" });

    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0), makeList("list_b", 1)]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "list",
        source: { droppableId: "lists", index: 0 },
        destination: { droppableId: "lists", index: 1 },
      }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "List order failed",
      });
    });
  });

  test("reorders cards in the same list", async () => {
    updateCardOrder.mockResolvedValue({
      data: [{ id: "card_b" }, { id: "card_a" }],
    });
    const list = makeList("list_a", 0, [
      makeCard("card_a", "list_a", 0),
      makeCard("card_b", "list_a", 1),
    ]);

    render(<ListContainer boardId={boardId} data={[list]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_a", index: 1 },
      }),
    );

    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledExactlyOnceWith({
        boardId,
        items: [
          expect.objectContaining({ id: "card_b", order: 0 }),
          expect.objectContaining({ id: "card_a", order: 1 }),
        ],
      });
    });
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Card reordered",
    });
  });

  test("moves a card across lists and executes with destination cards", async () => {
    updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
    const source = makeList("list_a", 0, [makeCard("card_a", "list_a", 0)]);
    const destination = makeList("list_b", 1, [
      makeCard("card_b", "list_b", 0),
    ]);

    render(<ListContainer boardId={boardId} data={[source, destination]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_b", index: 0 },
      }),
    );

    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledExactlyOnceWith({
        boardId,
        items: [
          expect.objectContaining({
            id: "card_a",
            listId: "list_b",
            order: 0,
          }),
          expect.objectContaining({ id: "card_b", order: 1 }),
        ],
      });
    });
  });

  test("initializes missing card arrays when moving across lists", async () => {
    updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
    const source = makeList("list_a", 0, [makeCard("card_a", "list_a", 0)]);
    const destination = {
      ...makeList("list_b", 1),
      cards: undefined as unknown as ListWithCardsOrderedByOrderAsc["cards"],
    };

    render(<ListContainer boardId={boardId} data={[source, destination]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_b", index: 0 },
      }),
    );

    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledExactlyOnceWith({
        boardId,
        items: [
          expect.objectContaining({
            id: "card_a",
            listId: "list_b",
            order: 0,
          }),
        ],
      });
    });
  });

  test("initializes a missing source cards array and no-ops when empty", () => {
    const source = {
      ...makeList("list_a", 0),
      cards: undefined as unknown as ListWithCardsOrderedByOrderAsc["cards"],
    };

    render(<ListContainer boardId={boardId} data={[source]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_a", index: 1 },
      }),
    );

    expect(updateCardOrder).not.toHaveBeenCalled();
  });

  test("reindexes remaining source cards after a cross-list move", async () => {
    updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
    const source = makeList("list_a", 0, [
      makeCard("card_a", "list_a", 0),
      makeCard("card_b", "list_a", 1),
    ]);
    const destination = makeList("list_b", 1, []);

    render(<ListContainer boardId={boardId} data={[source, destination]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_b", index: 0 },
      }),
    );

    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledExactlyOnceWith({
        boardId,
        items: [
          expect.objectContaining({
            id: "card_a",
            listId: "list_b",
            order: 0,
          }),
        ],
      });
    });
  });

  test("does nothing when the dragged card is missing from the source list", () => {
    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0, []), makeList("list_b", 1, [])]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_b", index: 0 },
      }),
    );

    expect(updateCardOrder).not.toHaveBeenCalled();
  });

  test("does nothing when the source or destination list is missing", () => {
    render(
      <ListContainer
        boardId={boardId}
        data={[makeList("list_a", 0, [makeCard("card_a", "list_a", 0)])]}
      />,
    );

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "missing", index: 0 },
      }),
    );

    expect(updateCardOrder).not.toHaveBeenCalled();
  });

  test("toasts when card reorder fails", async () => {
    updateCardOrder.mockResolvedValue({ serverError: "Card order failed" });
    const list = makeList("list_a", 0, [
      makeCard("card_a", "list_a", 0),
      makeCard("card_b", "list_a", 1),
    ]);

    render(<ListContainer boardId={boardId} data={[list]} />);

    fireDragEnd(
      dropResult({
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_a", index: 1 },
      }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Card order failed",
      });
    });
  });
});
