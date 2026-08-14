"use client";

import { type Card } from "@/app/generated/prisma/client";
import { useCardModalStore } from "@/stores/use-card-modal-store";
import { Draggable } from "@hello-pangea/dnd";

interface CardItemProps {
  index: number;
  card: Card;
}

export const CardItem = ({ index, card }: CardItemProps) => {
  const handleOpen = useCardModalStore((state) => state.open);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={() => handleOpen(card.id)}
          className="truncate rounded-md border-2 border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-black"
          role="button"
        >
          {card.title}
        </div>
      )}
    </Draggable>
  );
};
