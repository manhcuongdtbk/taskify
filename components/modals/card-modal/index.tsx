"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCardModal } from "@/hooks/use-card-modal";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { CardWithList } from "@/types";
import { CardModalHeader } from "./card-modal-header";
import { CardModalDescription } from "./card-modal-description";
import { CardModalActions } from "./card-modal-actions";
import { type AuditLog } from "@/app/generated/prisma/client";
import { CardModalActivity } from "./card-modal-activity";

export const CardModal = () => {
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  // TODO: fix the eslint error
  // eslint-disable-next-line @tanstack/query/prefer-query-options
  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id],
    queryFn: () => fetcher(`/api/cards/${id}`),
  });

  // TODO: fix the eslint error
  // eslint-disable-next-line @tanstack/query/prefer-query-options
  const { data: auditLogsData } = useQuery<AuditLog[]>({
    queryKey: ["card-logs", id],
    queryFn: () => fetcher(`/api/cards/${id}/logs`),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        {!cardData ? <CardModalHeader.Skeleton /> : <CardModalHeader data={cardData} />}
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="col-span-3">
            <div className="w-full space-y-6">
              {!cardData ? (
                <CardModalDescription.Skeleton />
              ) : (
                <CardModalDescription data={cardData} />
              )}
              {!auditLogsData ? (
                <CardModalActivity.Skeleton />
              ) : (
                <CardModalActivity items={auditLogsData} />
              )}
            </div>
          </div>
          {!cardData ? <CardModalActions.Skeleton /> : <CardModalActions data={cardData} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
