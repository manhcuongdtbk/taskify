"use client";

import { deleteBoard } from "@/actions/delete-board";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { useAction } from "@/hooks/use-action";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface BoardOptionsProps {
  id: string;
}

export const BoardOptions = ({ id }: BoardOptionsProps) => {
  const { execute, isLoading } = useAction(deleteBoard, {
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  const handleDelete = () => {
    execute({ id });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="h-auto w-auto p-2"
            variant="ghost"
            aria-label="Board actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">
          Board actions
        </div>
        <PopoverClose
          render={
            <Button
              className="absolute top-2 right-2 h-auto w-auto p-2 text-neutral-600"
              variant="ghost"
              aria-label="Close board actions"
            >
              <X className="h-4 w-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isLoading}
          className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
        >
          Delete this board
        </Button>
      </PopoverContent>
    </Popover>
  );
};
