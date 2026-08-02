"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type CardWithList } from "@/types";
import { Copy, Trash } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { copyCard } from "@/actions/copy-card";
import { deleteCard } from "@/actions/delete-card";
import { useParams } from "next/navigation";
import { useCardModalStore } from "@/hooks/use-card-modal-store";
import { toast } from "@/components/ui/toast";

interface CardModalActionsProps {
  data: CardWithList;
}

export const CardModalActions = ({ data }: CardModalActionsProps) => {
  const params = useParams();
  const close = useCardModalStore((state) => state.close);

  const { execute: executeCopyCard, isLoading: isLoadingCopy } = useAction(
    copyCard,
    {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: `Card "${data.title}" copied`,
        });
        close();
      },
      onError: (error) => {
        toast.add({
          type: "error",
          title: error,
        });
      },
    },
  );
  const { execute: executeDeleteCard, isLoading: isLoadingDelete } = useAction(
    deleteCard,
    {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: `Card "${data.title}" deleted`,
        });
        close();
      },
      onError: (error) => {
        toast.add({
          type: "error",
          title: error,
        });
      },
    },
  );

  const handleCopy = () => {
    const boardId = params.boardId as string;

    executeCopyCard({ id: data.id, boardId });
  };

  const handleDelete = () => {
    const boardId = params.boardId as string;

    executeDeleteCard({ id: data.id, boardId });
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-semibold">Actions</p>
      <Button
        variant="secondary"
        className="w-full justify-start"
        size="sm"
        onClick={handleCopy}
        disabled={isLoadingCopy}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>
      <Button
        variant="secondary"
        className="w-full justify-start"
        size="sm"
        onClick={handleDelete}
        disabled={isLoadingDelete}
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  );
};

CardModalActions.Skeleton = function ActionsSkeleton() {
  return (
    <div className="mt-2 space-y-2">
      <Skeleton className="h-4 w-20 bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
    </div>
  );
};
