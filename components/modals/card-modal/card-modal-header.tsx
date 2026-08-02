"use client";

import { FormInput } from "@/components/form/form-input";
import { Skeleton } from "@/components/ui/skeleton";
import { type CardWithList } from "@/types";
import { Layout } from "lucide-react";
import { type ComponentRef, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { toast } from "@/components/ui/toast";

interface CardModalHeaderProps {
  data: CardWithList;
}

export const CardModalHeader = ({ data }: CardModalHeaderProps) => {
  const queryClient = useQueryClient();
  const params = useParams();
  const { execute } = useAction(updateCard, {
    onSuccess: (data) => {
      // TODO: fix the eslint error
      // eslint-disable-next-line @tanstack/query/prefer-query-options
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      // TODO: fix the eslint error
      // eslint-disable-next-line @tanstack/query/prefer-query-options
      queryClient.invalidateQueries({ queryKey: ["card-logs", data.id] });
      toast.add({
        type: "success",
        title: `Renamed to ${data.title}`,
      });
      setTitle(data.title);
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });
  const inputRef = useRef<ComponentRef<"input">>(null);
  const [title, setTitle] = useState(data.title);

  const handleBlur = () => {
    inputRef.current?.form?.requestSubmit();
  };

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const boardId = params.boardId as string;

    if (title === data.title) return;

    execute({ title, boardId, id: data.id });
  };

  return (
    <div className="mb-6 flex w-full items-start gap-x-3">
      <Layout className="mt-1 h-5 w-5 text-neutral-700" />
      <div className="w-full">
        <form action={handleSubmit}>
          <FormInput
            ref={inputRef}
            onBlur={handleBlur}
            id="title"
            defaultValue={title}
            className="focus-visible::border-input relative -left-1.5 mb-0.5 w-[95%] truncate border-transparent bg-transparent px-1 text-xl font-semibold text-neutral-700 focus-visible:bg-white"
          />
        </form>
        <p className="text-sm text-muted-foreground">
          in list <span className="underline">{data.list.title}</span>
        </p>
      </div>
    </div>
  );
};

CardModalHeader.Skeleton = function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-start gap-x-3">
      <Skeleton className="mt-1 h-6 w-6 bg-neutral-200" />
      <div>
        <Skeleton className="mb-1 h-6 w-24 bg-neutral-200" />
        <Skeleton className="h-4 w-12 bg-neutral-200" />
      </div>
    </div>
  );
};
