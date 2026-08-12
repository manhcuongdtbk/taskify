"use client";

import { type ListWithCards } from "@/lib/prisma/payloads";
import { ListHeader } from "./list-header";
import { type ComponentRef, useRef, useState } from "react";
import { CardForm } from "./card-form";
import { cn } from "@/lib/utils";
import { CardItem } from "./card-item";
import { Draggable, Droppable } from "@hello-pangea/dnd";

interface ListItemProps {
  index: number;
  data: ListWithCards;
}

export const ListItem = ({ index, data }: ListItemProps) => {
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
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <li
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="h-full w-68 shrink-0 select-none"
        >
          <div
            {...provided.dragHandleProps}
            className="w-full rounded-md bg-[#f1f2f4] pb-2 shadow-md"
          >
            <ListHeader data={data} onAddCard={handleEnableEditing} />
            <Droppable droppableId={data.id} type="card">
              {(provided) => (
                <ol
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={
                    (cn("mx-1 flex flex-col gap-y-2 px-1 py-0.5"),
                    data.cards.length > 0 ? "mt-2" : "mt-0")
                  }
                >
                  {data.cards.map((card, index) => (
                    <CardItem key={card.id} data={card} index={index} />
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
              listId={data.id}
            />
          </div>
        </li>
      )}
    </Draggable>
  );
};
