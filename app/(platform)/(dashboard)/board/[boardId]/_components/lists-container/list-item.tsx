"use client";

import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";
import { ListHeader } from "./list-header";
import { type ComponentRef, useRef, useState } from "react";
import { CardForm } from "./card-form";
import { cn } from "@/lib/utils";
import { CardItem } from "./card-item";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ListWrapper } from "./list-wrapper";

interface ListItemProps {
  index: number;
  list: ListWithCardsOrderedByOrderAsc;
}

export const ListItem = ({ index, list }: ListItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<ComponentRef<"textarea">>(null);

  const handleDisableEditing = () => {
    setIsEditing(false);
  };

  const handleEnableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <ListWrapper {...provided.draggableProps} ref={provided.innerRef}>
          <div
            {...provided.dragHandleProps}
            className="w-full rounded-md bg-[#f1f2f4] pb-2 shadow-md"
          >
            <ListHeader list={list} onAddCard={handleEnableEditing} />
            <Droppable droppableId={list.id} type="card">
              {(provided) => (
                <ol
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "mx-1 flex flex-col gap-y-2 px-1 py-0.5",
                    list.cards.length > 0 ? "mt-2" : "mt-0",
                  )}
                >
                  {list.cards.map((card, index) => (
                    <CardItem key={card.id} card={card} index={index} />
                  ))}
                  {provided.placeholder}
                </ol>
              )}
            </Droppable>
            <CardForm
              ref={textareaRef}
              isEditing={isEditing}
              onEnableEditing={handleEnableEditing}
              onDisableEditing={handleDisableEditing}
              listId={list.id}
            />
          </div>
        </ListWrapper>
      )}
    </Draggable>
  );
};
