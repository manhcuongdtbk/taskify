"use client";

import { type Card } from "@/app/generated/prisma/client";
import { useCardModalStore } from "@/stores/use-card-modal-store";
import { Draggable } from "@hello-pangea/dnd";
import { type KeyboardEvent } from "react";

interface CardItemProps {
  index: number;
  card: Card;
}

export const CardItem = ({ index, card }: CardItemProps) => {
  const handleOpen = useCardModalStore((state) => state.open);

  const handleActivate = () => {
    handleOpen(card.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Space lifts the card in @hello-pangea/dnd's keyboard sensor. Do not
    // treat Space as activate — that would open the modal and trap Tab.
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleActivate();
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={handleActivate}
          // After the spread so we add Enter-to-open without replacing
          // role / tabIndex from dragHandleProps.
          onKeyDown={handleKeyDown}
          className="truncate rounded-md border-2 border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-black"
        >
          {card.title}
        </div>
      )}
    </Draggable>
  );
};
