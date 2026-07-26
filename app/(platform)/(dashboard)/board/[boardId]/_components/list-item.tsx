"use client";

import { type ListWithCards } from "@/types";
import { ListHeader } from "./list-header";
import { type ComponentRef, useRef, useState } from "react";
import { CardForm } from "./card-form";

interface ListItemProps {
  index: number;
  data: ListWithCards;
}

export function ListItem({ index, data }: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<ComponentRef<"textarea">>(null);

  const disableEditing = () => {
    setIsEditing(false);
  };

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  };

  return (
    <li className="h-full w-68 shrink-0 select-none">
      <div className="w-full rounded-md bg-[#f1f2f4] pb-2 shadow-md">
        <ListHeader data={data} onAddCard={enableEditing} />
        <CardForm
          ref={textareaRef}
          isEditing={isEditing}
          enableEditing={enableEditing}
          disableEditing={disableEditing}
          listId={data.id}
        />
      </div>
    </li>
  );
}
