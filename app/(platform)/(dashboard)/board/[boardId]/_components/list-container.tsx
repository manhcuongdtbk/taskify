"use client";

import { type Card } from "@/app/generated/prisma/client";
import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";
import { ListForm } from "./list-form";
import { useEffect, useState } from "react";
import { ListItem } from "./list-item";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { updateListOrder } from "@/actions/update-list-order";
import { toast } from "@/components/ui/toast";
import { useAction } from "@/hooks/use-action";
import { updateCardOrder } from "@/actions/update-card-order";

interface ListContainerProps {
  boardId: string;
  data: ListWithCardsOrderedByOrderAsc[];
}

type ListOrCard = ListWithCardsOrderedByOrderAsc | Card;

function rearrange<T extends ListOrCard>(
  items: T[],
  from: number,
  to: number,
): T[] {
  const item = items[from];
  return items.toSpliced(from, 1).toSpliced(to, 0, item);
}

function updateOrder<T extends ListOrCard>(items: T[]): T[] {
  return items.map((item, order) => ({ ...item, order }));
}

export const ListContainer = ({ boardId, data }: ListContainerProps) => {
  const [lists, setLists] = useState(data);
  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: (data) => {
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
    onSuccess: (data) => {
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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    // if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // user moves a list
    if (type === "list") {
      const rearrangedLists = rearrange(lists, source.index, destination.index);
      const orderedLists = updateOrder(rearrangedLists);
      setLists(orderedLists);
      executeUpdateListOrder({
        boardId,
        items: orderedLists,
      });
    }

    // user moves a card
    if (type === "card") {
      const nextLists = [...lists];

      // source and destination list
      const sourceList = nextLists.find(
        (list) => list.id === source.droppableId,
      );
      const destinationList = nextLists.find(
        (list) => list.id === destination.droppableId,
      );

      if (!sourceList || !destinationList) return;

      // check if cards exists on the source list
      if (!sourceList.cards) {
        sourceList.cards = [];
      }

      // check if cards exists on the destination list
      if (!destinationList.cards) {
        destinationList.cards = [];
      }

      // moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        if (sourceList.cards.length === 0) return;

        const rearrangedCards = rearrange(
          sourceList.cards,
          source.index,
          destination.index,
        );
        const orderedCards = updateOrder(rearrangedCards);

        sourceList.cards = orderedCards;

        setLists(nextLists);
        executeUpdateCardOrder({
          boardId,
          items: orderedCards,
        });
        // user moves the card to another list
      } else {
        // remove card from the source list
        const [movedCard] = sourceList.cards.splice(source.index, 1);
        if (!movedCard) return;

        // assign the new listId to the moved card
        movedCard.listId = destination.droppableId;

        // add card to the destination list
        destinationList.cards.splice(destination.index, 0, movedCard);

        const orderedSourceCards = updateOrder(sourceList.cards);
        sourceList.cards = orderedSourceCards;

        // update the order for each card in the destination list
        const orderedDestinationCards = updateOrder(destinationList.cards);
        destinationList.cards = orderedDestinationCards;

        setLists(nextLists);
        executeUpdateCardOrder({
          boardId,
          items: orderedDestinationCards,
        });
      }
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
