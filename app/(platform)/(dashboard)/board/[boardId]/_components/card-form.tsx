"use client";

import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  type ComponentRef,
  forwardRef,
  type RefObject,
  useRef,
  type KeyboardEventHandler,
} from "react";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { createCard } from "@/actions/create-card";
import { useEventListener, useOnClickOutside } from "usehooks-ts";
import { toast } from "sonner";

interface CardFormProps {
  listId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  isEditing: boolean;
}

export const CardForm = forwardRef<ComponentRef<"textarea">, CardFormProps>(
  ({ listId, enableEditing, disableEditing, isEditing }, ref) => {
    const params = useParams();
    const formRef = useRef<ComponentRef<"form">>(null);

    const { execute, fieldErrors } = useAction(createCard, {
      onSuccess: (data) => {
        toast.success(`Card "${data.title}" created`);
        formRef.current?.reset();
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        disableEditing();
      }
    };

    useOnClickOutside(
      formRef as RefObject<ComponentRef<"form">>,
      disableEditing,
    );
    useEventListener("keydown", onKeyDown);

    const onTextareaKeyDown: KeyboardEventHandler<ComponentRef<"textarea">> = (
      event,
    ) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    const onSubmit = (formData: FormData) => {
      const title = formData.get("title") as string;
      const boardId = params.boardId as string;
      const listId = formData.get("listId") as string;
      execute({ title, boardId, listId });
    };

    if (isEditing) {
      return (
        <form
          className="m-1 space-y-4 px-1 py-0.5"
          ref={formRef}
          action={onSubmit}
        >
          <FormTextarea
            id="title"
            onKeyDown={onTextareaKeyDown}
            ref={ref}
            placeholder="Enter a title for this card..."
            errors={fieldErrors}
          />
          <input hidden id="listId" name="listId" value={listId} />
          <div className="flex items-center gap-x-1">
            <FormSubmit>Add card</FormSubmit>
            <Button onClick={disableEditing} variant="ghost" size="sm">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="px-2 pt-2">
        <Button
          onClick={enableEditing}
          className="h-auto w-full justify-start px-2 py-1.5 text-sm text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a card
        </Button>
      </div>
    );
  },
);

CardForm.displayName = "CardForm";
