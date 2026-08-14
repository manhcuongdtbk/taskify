"use client";

import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  type ComponentProps,
  type ComponentRef,
  type RefObject,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { createCard } from "@/actions/create-card";
import { useEventListener, useOnClickOutside } from "usehooks-ts";
import { toast } from "@/components/ui/toast";
import { formDataString } from "@/lib/form-data";

type CardFormProps = {
  listId: string;
  onEnableEditing: () => void;
  onDisableEditing: () => void;
  isEditing: boolean;
} & Pick<ComponentProps<typeof FormTextarea>, "ref">;

export const CardForm = ({
  listId,
  onEnableEditing,
  onDisableEditing,
  isEditing,
  ref,
}: CardFormProps) => {
  const params = useParams();
  const formRef = useRef<ComponentRef<"form">>(null);

  const { execute, fieldErrors } = useAction(createCard, {
    onSuccess: (card) => {
      toast.add({
        type: "success",
        title: `Card "${card.title}" created`,
      });
      formRef.current?.reset();
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onDisableEditing();
    }
  };

  useOnClickOutside(
    formRef as RefObject<ComponentRef<"form">>,
    onDisableEditing,
  );
  useEventListener("keydown", handleKeyDown);

  const handleTextareaKeyDown: NonNullable<
    ComponentProps<typeof FormTextarea>["onKeyDown"]
  > = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = (formData: FormData) => {
    const title = formDataString(formData, "title");
    const listIdFromForm = formDataString(formData, "listId");
    const boardId = params.boardId as string;
    execute({ title, boardId, listId: listIdFromForm });
  };

  if (isEditing) {
    return (
      <form
        className="m-1 space-y-4 px-1 py-0.5"
        ref={formRef}
        action={handleSubmit}
      >
        <FormTextarea
          id="title"
          onKeyDown={handleTextareaKeyDown}
          ref={ref}
          placeholder="Enter a title for this card..."
          errors={fieldErrors}
        />
        <input hidden id="listId" name="listId" value={listId} />
        <div className="flex items-center gap-x-1">
          <FormSubmit>Add card</FormSubmit>
          <Button onClick={onDisableEditing} variant="ghost" size="sm">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="px-2 pt-2">
      <Button
        onClick={onEnableEditing}
        className="h-auto w-full justify-start px-2 py-1.5 text-sm text-muted-foreground"
        size="sm"
        variant="ghost"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a card
      </Button>
    </div>
  );
};
