"use client";

import { copyList } from "@/actions/copy-list";
import { deleteList } from "@/actions/delete-list";
import { type List } from "@/app/generated/prisma/client";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAction } from "@/hooks/use-action";
import { formDataString } from "@/lib/form-data";
import { MoreHorizontal, X } from "lucide-react";
import { type ComponentRef, useRef } from "react";
import { toast } from "@/components/ui/toast";

interface ListOptionsProps {
  data: List;
  onAddCard: () => void;
}

export const ListOptions = ({ data, onAddCard }: ListOptionsProps) => {
  const closeRef = useRef<ComponentRef<"button">>(null);

  const { execute: executeDelete } = useAction(deleteList, {
    onSuccess: (data) => {
      toast.add({
        type: "success",
        title: `List "${data.title}" deleted`,
      });
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  const { execute: executeCopy } = useAction(copyList, {
    onSuccess: (data) => {
      toast.add({
        type: "success",
        title: `List "${data.title}" copied`,
      });
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  const handleDelete = (formData: FormData) => {
    const id = formDataString(formData, "id");
    const boardId = formDataString(formData, "boardId");
    executeDelete({ id, boardId });
  };

  const handleCopy = (formData: FormData) => {
    const id = formDataString(formData, "id");
    const boardId = formDataString(formData, "boardId");
    executeCopy({ id, boardId });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button className="h-auto w-auto p-2" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">
          List actions
        </div>
        <PopoverClose
          render={
            <Button
              className="absolute top-2 right-2 h-auto w-auto p-2 text-neutral-600"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          }
          ref={closeRef}
        />
        <Button
          onClick={onAddCard}
          className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          variant="ghost"
        >
          Add card...
        </Button>
        <form action={handleCopy}>
          <input hidden id="id" name="id" value={data.id} />
          <input hidden id="boardId" name="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          >
            Copy list...
          </FormSubmit>
        </form>
        <Separator />
        <form action={handleDelete}>
          <input hidden id="id" name="id" value={data.id} />
          <input hidden id="boardId" name="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          >
            Delete list...
          </FormSubmit>
        </form>
      </PopoverContent>
    </Popover>
  );
};
