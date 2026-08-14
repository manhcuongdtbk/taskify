"use client";

import { Button } from "@/components/ui/button";
import { SkeletonStatus } from "@/components/skeleton-status";
import { Skeleton } from "@/components/ui/skeleton";
import { type CardWithListTitle } from "@/lib/prisma/query-options/card";
import { Copy, Trash } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { copyCard } from "@/actions/copy-card";
import { deleteCard } from "@/actions/delete-card";
import { useParams } from "next/navigation";
import { useCardModalStore } from "@/stores/use-card-modal-store";
import { toast } from "@/components/ui/toast";

const heading = "Actions";

interface CardModalActionsProps {
  card: CardWithListTitle;
}

export const CardModalActions = ({ card }: CardModalActionsProps) => {
  const params = useParams();
  const close = useCardModalStore((state) => state.close);

  const { execute: executeCopyCard, isLoading: isLoadingCopy } = useAction(
    copyCard,
    {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: `Card "${card.title}" copied`,
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
          title: `Card "${card.title}" deleted`,
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

    executeCopyCard({ id: card.id, boardId });
  };

  const handleDelete = () => {
    const boardId = params.boardId as string;

    executeDeleteCard({ id: card.id, boardId });
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-semibold">{heading}</p>
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
    <SkeletonStatus heading={heading} className="mt-2 space-y-2">
      <Skeleton className="h-4 w-20 bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
      <Skeleton className="h-8 w-full bg-neutral-200" />
    </SkeletonStatus>
  );
};
