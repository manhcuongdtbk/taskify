"use client";

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

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const ListContainer = ({ boardId, data }: ListContainerProps) => {
  const [orderedData, setOrderedData] = useState(data);
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
    setOrderedData(data);
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
      const items = reorder(orderedData, source.index, destination.index).map(
        (item, index) => ({
          ...item,
          order: index,
        }),
      );
      setOrderedData(items);
      executeUpdateListOrder({
        boardId,
        items,
      });
    }

    // user moves a card
    if (type === "card") {
      const newOrderedData = [...orderedData];

      // source and destination list
      const sourceList = newOrderedData.find(
        (list) => list.id === source.droppableId,
      );
      const destinationList = newOrderedData.find(
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

        const reorderedCards = reorder(
          sourceList.cards,
          source.index,
          destination.index,
        );

        reorderedCards.forEach((card, index) => {
          card.order = index;
        });

        sourceList.cards = reorderedCards;

        setOrderedData(newOrderedData);
        executeUpdateCardOrder({
          boardId,
          items: reorderedCards,
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

        sourceList.cards.forEach((card, index) => {
          card.order = index;
        });

        // update the order for each card in the destination list
        destinationList.cards.forEach((card, index) => {
          card.order = index;
        });

        setOrderedData(newOrderedData);
        executeUpdateCardOrder({
          boardId,
          items: destinationList.cards,
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
            {orderedData.map((list, index) => (
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
