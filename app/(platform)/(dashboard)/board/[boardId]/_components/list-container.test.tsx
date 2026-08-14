import { render, screen, waitFor } from "@testing-library/react";
import { type DroppableProvided, type DropResult } from "@hello-pangea/dnd";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";
import { cardFactory } from "@/lib/testing/factories/card";
import { listWithCardsOrderedByOrderAscFactory } from "@/lib/testing/factories/list";

type OnDragEnd = (result: DropResult) => void;

const onDragEndRef = vi.hoisted(() => {
  const current: OnDragEnd = () => {
    throw new Error("DragDropContext onDragEnd was not registered");
  };
  return { current };
});

const updateListOrder = vi.hoisted(() => vi.fn());
const updateCardOrder = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({
    onDragEnd,
    children,
  }: {
    onDragEnd: OnDragEnd;
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
    data: ListWithCardsOrderedByOrderAsc;
    index: number;
  }) => (
    <li
      data-testid={`list-${data.id}`}
      data-order={String(data.order)}
      data-index={String(index)}
    >
      {data.title}
      {data.cards?.map((card) => (
        <span
          key={card.id}
          data-testid={`card-${card.id}`}
          data-order={String(card.order)}
          data-list-id={card.listId}
        />
      ))}
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
  onDragEndRef.current(result);
}

/**
 * Query payloads always include `cards: []`, but ListContainer still treats
 * missing `cards` as `[]`. Named `as Model` for that hole — see docs/testing.md
 * (intentional partial).
 */
function listWithMissingCards(
  list: ListWithCardsOrderedByOrderAsc,
): ListWithCardsOrderedByOrderAsc {
  return {
    ...list,
    cards: undefined,
  } as unknown as ListWithCardsOrderedByOrderAsc;
}

describe("ListContainer", () => {
  describe("rendering", () => {
    test("renders lists and the list form", () => {
      const data = [
        listWithCardsOrderedByOrderAscFactory.build({
          id: "list_a",
          order: 0,
          boardId,
        }),
        listWithCardsOrderedByOrderAscFactory.build({
          id: "list_b",
          order: 1,
          boardId,
        }),
      ];

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

    test("syncs lists when props data change", () => {
      const listA = listWithCardsOrderedByOrderAscFactory.build({
        id: "list_a",
        order: 0,
        boardId,
      });
      const { rerender } = render(
        <ListContainer boardId={boardId} data={[listA]} />,
      );

      expect(screen.getByTestId("list-list_a")).toBeInTheDocument();

      rerender(
        <ListContainer
          boardId={boardId}
          data={[
            listA,
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_b",
              order: 1,
              boardId,
            }),
          ]}
        />,
      );

      expect(screen.getByTestId("list-list_a")).toBeInTheDocument();
      expect(screen.getByTestId("list-list_b")).toBeInTheDocument();
    });
  });

  describe("ignored drops", () => {
    test("does nothing when there is no destination", () => {
      render(
        <ListContainer
          boardId={boardId}
          data={[
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_a",
              order: 0,
              boardId,
            }),
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_b",
              order: 1,
              boardId,
            }),
          ]}
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

    test.for([
      {
        type: "list",
        source: { droppableId: "lists", index: 1 },
        destination: { droppableId: "lists", index: 1 },
      },
      {
        type: "card",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "list_a", index: 0 },
      },
    ])(
      "does nothing when a $type is dropped in the same position",
      (partial) => {
        render(
          <ListContainer
            boardId={boardId}
            data={[
              listWithCardsOrderedByOrderAscFactory.build({
                id: "list_a",
                order: 0,
                boardId,
              }),
              listWithCardsOrderedByOrderAscFactory.build({
                id: "list_b",
                order: 1,
                boardId,
              }),
            ]}
          />,
        );

        fireDragEnd(dropResult(partial));

        expect(updateListOrder).not.toHaveBeenCalled();
        expect(updateCardOrder).not.toHaveBeenCalled();
      },
    );

    test.for([
      {
        type: "list",
        source: { droppableId: "lists", index: 5 },
        destination: { droppableId: "lists", index: 0 },
        cards: undefined,
      },
      {
        type: "card",
        source: { droppableId: "list_a", index: 5 },
        destination: { droppableId: "list_a", index: 0 },
        cards: [{ id: "card_a", order: 0 }],
      },
    ])(
      "does nothing when the $type source index is out of range",
      ({ type, source, destination, cards }) => {
        render(
          <ListContainer
            boardId={boardId}
            data={[
              listWithCardsOrderedByOrderAscFactory.build(
                { id: "list_a", order: 0, boardId },
                cards
                  ? {
                      associations: {
                        cards: cards.map((card) => cardFactory.build(card)),
                      },
                    }
                  : undefined,
              ),
              listWithCardsOrderedByOrderAscFactory.build({
                id: "list_b",
                order: 1,
                boardId,
              }),
            ]}
          />,
        );

        fireDragEnd(
          dropResult({
            type,
            source,
            destination,
          }),
        );

        expect(updateListOrder).not.toHaveBeenCalled();
        expect(updateCardOrder).not.toHaveBeenCalled();
      },
    );

    test("throws when the drag type is neither list nor card", () => {
      render(
        <ListContainer
          boardId={boardId}
          data={[
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_a",
              order: 0,
              boardId,
            }),
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_b",
              order: 1,
              boardId,
            }),
          ]}
        />,
      );

      expect(() =>
        fireDragEnd(
          dropResult({
            type: "column",
            source: { droppableId: "lists", index: 0 },
            destination: { droppableId: "lists", index: 1 },
          }),
        ),
      ).toThrow("Unexpected drag type: column");
      expect(updateListOrder).not.toHaveBeenCalled();
      expect(updateCardOrder).not.toHaveBeenCalled();
    });

    test.for([
      {
        missing: "destination",
        source: { droppableId: "list_a", index: 0 },
        destination: { droppableId: "missing", index: 0 },
      },
      {
        missing: "source",
        source: { droppableId: "missing", index: 0 },
        destination: { droppableId: "list_a", index: 0 },
      },
    ])(
      "does nothing when the $missing list is missing",
      ({ source, destination }) => {
        render(
          <ListContainer
            boardId={boardId}
            data={[
              listWithCardsOrderedByOrderAscFactory.build(
                { id: "list_a", order: 0, boardId },
                {
                  associations: {
                    cards: [cardFactory.build({ id: "card_a", order: 0 })],
                  },
                },
              ),
            ]}
          />,
        );

        fireDragEnd(
          dropResult({
            type: "card",
            source,
            destination,
          }),
        );

        expect(updateListOrder).not.toHaveBeenCalled();
        expect(updateCardOrder).not.toHaveBeenCalled();
      },
    );
  });

  describe("lists", () => {
    test("reorders lists", async () => {
      updateListOrder.mockResolvedValue({
        data: [{ id: "list_b" }, { id: "list_a" }],
      });

      render(
        <ListContainer
          boardId={boardId}
          data={[
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_a",
              order: 0,
              boardId,
            }),
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_b",
              order: 1,
              boardId,
            }),
          ]}
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
      });
      expect(screen.getByTestId("list-list_a")).toHaveAttribute(
        "data-index",
        "1",
      );

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

    test("toasts when reorder fails", async () => {
      updateListOrder.mockResolvedValue({ serverError: "List order failed" });

      render(
        <ListContainer
          boardId={boardId}
          data={[
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_a",
              order: 0,
              boardId,
            }),
            listWithCardsOrderedByOrderAscFactory.build({
              id: "list_b",
              order: 1,
              boardId,
            }),
          ]}
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
  });

  describe("cards", () => {
    describe("same list", () => {
      test("reorders cards", async () => {
        updateCardOrder.mockResolvedValue({
          data: [{ id: "card_b" }, { id: "card_a" }],
        });
        const list = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [
                cardFactory.build({ id: "card_a", order: 0 }),
                cardFactory.build({ id: "card_b", order: 1 }),
              ],
            },
          },
        );

        render(<ListContainer boardId={boardId} data={[list]} />);

        fireDragEnd(
          dropResult({
            type: "card",
            source: { droppableId: "list_a", index: 0 },
            destination: { droppableId: "list_a", index: 1 },
          }),
        );

        await waitFor(() => {
          expect(screen.getByTestId("card-card_b")).toHaveAttribute(
            "data-order",
            "0",
          );
        });
        expect(screen.getByTestId("card-card_a")).toHaveAttribute(
          "data-order",
          "1",
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

      test("does nothing when the list has no cards", () => {
        const source = listWithMissingCards(
          listWithCardsOrderedByOrderAscFactory.build({
            id: "list_a",
            order: 0,
            boardId,
          }),
        );

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

      test("toasts when reorder fails", async () => {
        updateCardOrder.mockResolvedValue({ serverError: "Card order failed" });
        const list = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [
                cardFactory.build({ id: "card_a", order: 0 }),
                cardFactory.build({ id: "card_b", order: 1 }),
              ],
            },
          },
        );

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

    describe("across lists", () => {
      test("moves a card", async () => {
        updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
        const source = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [cardFactory.build({ id: "card_a", order: 0 })],
            },
          },
        );
        const destination = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_b", order: 1, boardId },
          {
            associations: {
              cards: [cardFactory.build({ id: "card_b", order: 0 })],
            },
          },
        );

        render(
          <ListContainer boardId={boardId} data={[source, destination]} />,
        );

        fireDragEnd(
          dropResult({
            type: "card",
            source: { droppableId: "list_a", index: 0 },
            destination: { droppableId: "list_b", index: 0 },
          }),
        );

        await waitFor(() => {
          expect(screen.getByTestId("card-card_a")).toHaveAttribute(
            "data-list-id",
            "list_b",
          );
        });
        expect(screen.getByTestId("card-card_a")).toHaveAttribute(
          "data-order",
          "0",
        );
        expect(screen.getByTestId("card-card_b")).toHaveAttribute(
          "data-list-id",
          "list_b",
        );
        expect(screen.getByTestId("card-card_b")).toHaveAttribute(
          "data-order",
          "1",
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
        expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
          type: "success",
          title: "Card reordered",
        });
      });

      test("does not mutate the lists passed as data when moving a card across lists", async () => {
        updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
        const source = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [
                cardFactory.build({
                  id: "card_a",
                  listId: "list_a",
                  order: 0,
                }),
              ],
            },
          },
        );
        const destination = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_b", order: 1, boardId },
          {
            associations: {
              cards: [
                cardFactory.build({
                  id: "card_b",
                  listId: "list_b",
                  order: 0,
                }),
              ],
            },
          },
        );
        const sourceCard = source.cards[0];
        const destinationCard = destination.cards[0];

        render(
          <ListContainer boardId={boardId} data={[source, destination]} />,
        );

        fireDragEnd(
          dropResult({
            type: "card",
            source: { droppableId: "list_a", index: 0 },
            destination: { droppableId: "list_b", index: 0 },
          }),
        );

        expect(updateCardOrder).toHaveBeenCalledOnce();
        expect(source.cards).toHaveLength(1);
        expect(source.cards[0]).toBe(sourceCard);
        expect(sourceCard.listId).toBe("list_a");
        expect(sourceCard.order).toBe(0);
        expect(destination.cards).toHaveLength(1);
        expect(destination.cards[0]).toBe(destinationCard);
        expect(destinationCard.listId).toBe("list_b");
        expect(destinationCard.order).toBe(0);
        await waitFor(() => {
          expect(screen.getByTestId("card-card_a")).toHaveAttribute(
            "data-list-id",
            "list_b",
          );
        });
      });

      test("moves a card onto a list with no cards", async () => {
        updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
        const source = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [cardFactory.build({ id: "card_a", order: 0 })],
            },
          },
        );
        const destination = listWithMissingCards(
          listWithCardsOrderedByOrderAscFactory.build({
            id: "list_b",
            order: 1,
            boardId,
          }),
        );

        render(
          <ListContainer boardId={boardId} data={[source, destination]} />,
        );

        fireDragEnd(
          dropResult({
            type: "card",
            source: { droppableId: "list_a", index: 0 },
            destination: { droppableId: "list_b", index: 0 },
          }),
        );

        await waitFor(() => {
          expect(screen.getByTestId("card-card_a")).toHaveAttribute(
            "data-list-id",
            "list_b",
          );
        });
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

      test("reindexes leftover source cards after a move onto an empty list", async () => {
        updateCardOrder.mockResolvedValue({ data: [{ id: "card_a" }] });
        const source = listWithCardsOrderedByOrderAscFactory.build(
          { id: "list_a", order: 0, boardId },
          {
            associations: {
              cards: [
                cardFactory.build({ id: "card_a", listId: "list_a", order: 0 }),
                cardFactory.build({ id: "card_b", listId: "list_a", order: 1 }),
              ],
            },
          },
        );
        const destination = listWithCardsOrderedByOrderAscFactory.build({
          id: "list_b",
          order: 1,
          boardId,
        });

        render(
          <ListContainer boardId={boardId} data={[source, destination]} />,
        );

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
                id: "card_b",
                listId: "list_a",
                order: 0,
              }),
              expect.objectContaining({
                id: "card_a",
                listId: "list_b",
                order: 0,
              }),
            ],
          });
        });
        expect(screen.getByTestId("card-card_a")).toHaveAttribute(
          "data-list-id",
          "list_b",
        );
        expect(screen.getByTestId("card-card_b")).toHaveAttribute(
          "data-list-id",
          "list_a",
        );
        expect(screen.getByTestId("card-card_b")).toHaveAttribute(
          "data-order",
          "0",
        );
      });

      test("does nothing when the dragged card is missing from the source list", () => {
        render(
          <ListContainer
            boardId={boardId}
            data={[
              listWithCardsOrderedByOrderAscFactory.build({
                id: "list_a",
                order: 0,
                boardId,
              }),
              listWithCardsOrderedByOrderAscFactory.build({
                id: "list_b",
                order: 1,
                boardId,
              }),
            ]}
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
    });
  });
});
