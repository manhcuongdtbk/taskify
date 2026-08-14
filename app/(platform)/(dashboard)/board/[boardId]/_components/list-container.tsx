"use client";

import { type Card } from "@/app/generated/prisma/client";
import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";
import { ListForm } from "./list-form";
import { useEffect, useState } from "react";
import { ListItem } from "./list-item";
import {
  DragDropContext,
  Droppable,
  type DraggableLocation,
  type DropResult,
} from "@hello-pangea/dnd";
import { updateListOrder } from "@/actions/update-list-order";
import { toast } from "@/components/ui/toast";
import { useAction } from "@/hooks/use-action";
import { updateCardOrder } from "@/actions/update-card-order";

interface ListContainerProps {
  boardId: string;
  data: ListWithCardsOrderedByOrderAsc[];
}

type ListOrCard = ListWithCardsOrderedByOrderAsc | Card;

// Copy + `splice`, not `toSpliced`: Next's baseline is Firefox 111+ but
// `Array.prototype.toSpliced` (ES2023) only landed in Firefox 115, and Next
// does not polyfill prototype methods.
function takeAt<T>(items: T[], index: number) {
  const [item] = items.splice(index, 1);
  return item;
}

function insertAt<T>(items: T[], index: number, item: T) {
  items.splice(index, 0, item);
}

function rearrange<T extends ListOrCard>(
  items: T[],
  from: number,
  to: number,
): T[] | undefined {
  const next = Array.from(items);
  const item = takeAt(next, from);
  if (item === undefined) return;

  insertAt(next, to, item);
  return next;
}

function updateOrder<T extends ListOrCard>(items: T[]): T[] {
  return items.map((item, order) => ({ ...item, order }));
}

function cardsOf(list: ListWithCardsOrderedByOrderAsc): Card[] {
  return Array.from(list.cards ?? []);
}

function withCardsOnList(
  lists: ListWithCardsOrderedByOrderAsc[],
  listId: string,
  cards: Card[],
): ListWithCardsOrderedByOrderAsc[] {
  return lists.map((list) => (list.id === listId ? { ...list, cards } : list));
}

function isSamePosition(
  source: DraggableLocation,
  destination: DraggableLocation,
) {
  return (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  );
}

export const ListContainer = ({ boardId, data }: ListContainerProps) => {
  const [lists, setLists] = useState(data);
  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "List reordered",
      });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });
  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Card reordered",
      });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  useEffect(() => {
    // TODO: true optimistic UI (`useOptimistic`) while dragging — docs/data.md
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLists(data);
  }, [data]);

  const persistListOrder = (nextLists: ListWithCardsOrderedByOrderAsc[]) => {
    setLists(nextLists);
    executeUpdateListOrder({ boardId, items: nextLists });
  };

  const persistCardOrder = (
    nextLists: ListWithCardsOrderedByOrderAsc[],
    items: Card[],
  ) => {
    setLists(nextLists);
    executeUpdateCardOrder({ boardId, items });
  };

  const moveList = (from: number, to: number) => {
    const rearranged = rearrange(lists, from, to);
    if (!rearranged) return;

    const nextLists = updateOrder(rearranged);
    persistListOrder(nextLists);
  };

  const moveCardWithinList = (
    list: ListWithCardsOrderedByOrderAsc,
    from: number,
    to: number,
  ) => {
    const cards = cardsOf(list);
    if (cards.length === 0) return;

    const rearranged = rearrange(cards, from, to);
    if (!rearranged) return;

    const nextCards = updateOrder(rearranged);
    const nextLists = withCardsOnList(lists, list.id, nextCards);
    persistCardOrder(nextLists, nextCards);
  };

  const moveCardAcrossLists = (
    sourceList: ListWithCardsOrderedByOrderAsc,
    destinationList: ListWithCardsOrderedByOrderAsc,
    from: number,
    to: number,
  ) => {
    const sourceCards = cardsOf(sourceList);
    const movedCard = takeAt(sourceCards, from);
    if (!movedCard) return;

    const cardOnDestination = {
      ...movedCard,
      listId: destinationList.id,
    };
    const destinationCards = cardsOf(destinationList);
    insertAt(destinationCards, to, cardOnDestination);

    const nextSourceCards = updateOrder(sourceCards);
    const nextDestinationCards = updateOrder(destinationCards);
    const listsWithRemainingSourceCards = withCardsOnList(
      lists,
      sourceList.id,
      nextSourceCards,
    );
    const nextLists = withCardsOnList(
      listsWithRemainingSourceCards,
      destinationList.id,
      nextDestinationCards,
    );

    persistCardOrder(nextLists, [...nextSourceCards, ...nextDestinationCards]);
  };

  const moveCard = (
    source: DraggableLocation,
    destination: DraggableLocation,
  ) => {
    const sourceList = lists.find((list) => list.id === source.droppableId);
    const destinationList = lists.find(
      (list) => list.id === destination.droppableId,
    );
    if (!sourceList || !destinationList) return;

    if (source.droppableId === destination.droppableId) {
      moveCardWithinList(sourceList, source.index, destination.index);
      return;
    }

    moveCardAcrossLists(
      sourceList,
      destinationList,
      source.index,
      destination.index,
    );
  };

  const handleDragEnd = ({ destination, source, type }: DropResult) => {
    if (!destination || isSamePosition(source, destination)) return;

    switch (type) {
      case "list":
        moveList(source.index, destination.index);
        return;
      case "card":
        moveCard(source, destination);
        return;
      default:
        throw new Error(`Unexpected drag type: ${type}`);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex h-full gap-x-3"
          >
            {lists.map((list, index) => (
              <ListItem key={list.id} index={index} data={list} />
            ))}
            {provided.placeholder}
            <ListForm />
            <div className="w-1 shrink-0" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  );
};
