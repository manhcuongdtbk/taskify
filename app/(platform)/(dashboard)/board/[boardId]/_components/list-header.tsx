"use client";

import { updateList } from "@/actions/update-list";
import { FormInput } from "@/components/form/form-input";
import { useAction } from "@/hooks/use-action";
import { type ListWithCards } from "@/types";
import { type ComponentRef, useRef, useState } from "react";
import { toast } from "sonner";
import { useEventListener } from "usehooks-ts";
import { ListOptions } from "./list-options";

interface ListHeaderProps {
  data: ListWithCards;
  onAddCard: () => void;
}

export function ListHeader({ data, onAddCard }: ListHeaderProps) {
  const [title, setTitle] = useState(data.title);
  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<ComponentRef<"form">>(null);
  const inputRef = useRef<ComponentRef<"input">>(null);

  const enableEditing = () => {
    setIsEditing(true);
    // TODO: explore flushSync (as a last resort?) to replace this. And why do we need `setTimeout` here?
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const { execute } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title); // Optimistic update
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    if (title === data.title) {
      return disableEditing();
    }

    execute({ id, title, boardId });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      formRef.current?.requestSubmit();
    }
  };

  useEventListener("keydown", onKeyDown);

  return (
    <div className="flex items-start justify-between gap-x-2 px-2 pt-2 text-sm font-semibold">
      {isEditing ? (
        <form className="flex-1 px-0.5" ref={formRef} action={handleSubmit}>
          <input hidden id="id" name="id" value={data.id} />
          <input hidden id="boardId" name="boardId" value={data.boardId} />
          <FormInput
            ref={inputRef}
            id="title"
            onBlur={onBlur}
            placeholder="Enter list title..."
            defaultValue={title}
            className="h-7 truncate border-transparent bg-transparent px-1.75 py-1 text-sm font-medium transition hover:border-input focus:border-input focus:bg-white"
          />
          <button type="submit" />
        </form>
      ) : (
        <div
          className="h-7 w-full border-transparent px-2.5 py-1 text-sm font-medium"
          onClick={enableEditing}
        >
          {title}
        </div>
      )}
      <ListOptions data={data} onAddCard={onAddCard} />
    </div>
  );
}
