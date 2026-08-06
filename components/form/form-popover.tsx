"use client";

import {
  Popover,
  PopoverContent,
  PopoverClose,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAction } from "@/hooks/use-action";
import { createBoard } from "@/actions/create-board";
import { type BoardImageInput } from "@/actions/create-board/types";
import { FormInput } from "./form-input";
import { FormSubmit } from "./form-submit";
import { Button } from "@/components/ui/button";
import { type BaseUIRenderForwardingProps } from "@/types";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { FormPicker } from "./form-picker";
import { type ComponentRef, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProModalStore } from "@/stores/use-pro-modal-store";
import { paths } from "@/lib/paths";

interface FormPopoverProps extends BaseUIRenderForwardingProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const FormPopover = ({
  children,
  side = "bottom",
  align,
  sideOffset = 0,
}: FormPopoverProps) => {
  const openProModal = useProModalStore((state) => state.open);
  const router = useRouter();
  const closeRef = useRef<ComponentRef<"button">>(null);
  const [selectedImage, setSelectedImage] = useState<BoardImageInput>();

  const { execute, fieldErrors } = useAction(createBoard, {
    onSuccess: (data) => {
      toast.add({
        type: "success",
        title: "Board created!",
      });
      closeRef.current?.click();
      router.push(paths.board(data.id));
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
      // Free board limit (or similar) → open Pro upgrade modal (Stripe Checkout).
      openProModal();
    },
  });

  const handleSelectImage = (image: BoardImageInput) => {
    setSelectedImage(image);
  };

  // FormPicker unmounts on close and refetches new images, so a kept selection
  // would be submitted without any check mark to show it.
  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedImage(undefined);
  };

  const handleSubmit = (formData: FormData) => {
    const title = formData.get("title");

    execute({
      title: typeof title === "string" ? title : "",
      // Sent unchecked so an empty picker fails in the schema as "Missing Image".
      image: selectedImage as BoardImageInput,
    });
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger render={children} />
      <PopoverContent
        align={align}
        className="w-80 pt-3"
        side={side}
        sideOffset={sideOffset}
      >
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">
          Create board
        </div>
        <PopoverClose
          ref={closeRef}
          render={
            <Button
              className="absolute top-2 right-2 h-auto w-auto p-2 text-neutral-600"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          }
        />
        <form className="space-y-4" action={handleSubmit}>
          <div className="space-y-4">
            <FormPicker
              selectedImage={selectedImage}
              onSelect={handleSelectImage}
              errors={fieldErrors}
            />
            {/* TODO: title clears after invalid submit — controlled title after failing test; see vitest backlog p2-form-popover-controlled-title */}
            <FormInput
              id="title"
              label="Board title"
              type="text"
              errors={fieldErrors}
            />
          </div>
          <FormSubmit className="w-full">Create</FormSubmit>
        </form>
      </PopoverContent>
    </Popover>
  );
};
