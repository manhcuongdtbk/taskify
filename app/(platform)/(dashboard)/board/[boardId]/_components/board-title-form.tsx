"use client";

import { updateBoard } from "@/actions/update-board";
import { type Board } from "@/app/generated/prisma/client";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { type ComponentRef, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";

interface BoardTitleFormProps {
  data: Board;
}

export const BoardTitleForm = ({ data }: BoardTitleFormProps) => {
  const { execute } = useAction(updateBoard, {
    onSuccess: (data) => {
      toast.add({
        type: "success",
        title: `Board "${data.title}" updated`,
      });
      setTitle(title); // Optimistically update the title
      disableEditing();
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });
  const formRef = useRef<ComponentRef<"form">>(null);
  const inputRef = useRef<ComponentRef<"input">>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);

  const disableEditing = () => {
    setIsEditing(false);
  };

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;

    execute({ id: data.id, title });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  if (isEditing) {
    return (
      <form
        ref={formRef}
        className="flex items-center gap-x-2"
        action={onSubmit}
      >
        <FormInput
          id="title"
          onBlur={onBlur}
          defaultValue={title}
          className="h-7 border-none bg-transparent px-1.75 py-1 text-lg font-bold focus-visible:ring-transparent focus-visible:outline-none"
          ref={inputRef}
        />
      </form>
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-auto w-auto p-1 px-2 text-lg font-bold"
      onClick={enableEditing}
    >
      {title}
    </Button>
  );
};
