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
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { FormPicker } from "./form-picker";
import {
  type ComponentProps,
  type ComponentRef,
  type ReactElement,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useProModalStore } from "@/stores/use-pro-modal-store";
import { paths } from "@/lib/paths";
import { FREE_BOARD_LIMIT_SERVER_ERROR } from "@/lib/errors/free-board-limit";

type FormPopoverProps = {
  children: Extract<
    ComponentProps<typeof PopoverTrigger>["render"],
    ReactElement
  >;
} & Pick<
  ComponentProps<typeof PopoverContent>,
  "side" | "align" | "sideOffset"
>;

export const FormPopover = ({
  children,
  side = "bottom",
  align,
  sideOffset = 0,
}: FormPopoverProps) => {
  const openProModal = useProModalStore((state) => state.open);
  const router = useRouter();
  const closeRef = useRef<ComponentRef<"button">>(null);
  const [title, setTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<BoardImageInput>();

  const { execute, fieldErrors } = useAction(createBoard, {
    onSuccess: (board) => {
      toast.add({
        type: "success",
        title: "Board created!",
      });
      closeRef.current?.click();
      router.push(paths.board(board.id));
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
      if (error !== FREE_BOARD_LIMIT_SERVER_ERROR) {
        return;
      }
      closeRef.current?.click();
      openProModal();
      router.refresh();
    },
  });

  const handleSelectImage = (image: BoardImageInput) => {
    setSelectedImage(image);
  };

  // FormPicker unmounts on close and refetches new images, so a kept selection
  // would be submitted without any check mark to show it.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedImage(undefined);
      setTitle("");
    }
  };

  const handleSubmit = () => {
    execute({
      title,
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
            <FormInput
              id="title"
              label="Board title"
              type="text"
              errors={fieldErrors}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <FormSubmit className="w-full">Create</FormSubmit>
        </form>
      </PopoverContent>
    </Popover>
  );
};
