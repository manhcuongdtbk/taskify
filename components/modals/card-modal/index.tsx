"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  selectCardModalIsOpen,
  useCardModalStore,
} from "@/stores/use-card-modal-store";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/lib/api/card";
import { CardModalHeader } from "./card-modal-header";
import { CardModalDescription } from "./card-modal-description";
import { CardModalActions } from "./card-modal-actions";
import { CardModalActivity } from "./card-modal-activity";

export const CardModal = () => {
  const id = useCardModalStore((state) => state.id);
  const isOpen = useCardModalStore(selectCardModalIsOpen);
  const handleClose = useCardModalStore((state) => state.close);

  const { data: card } = useQuery(cardQueries.detail(id));
  const { data: cardAuditLogs } = useQuery(cardQueries.auditLogs(id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        {!card ? <CardModalHeader.Skeleton /> : <CardModalHeader card={card} />}
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="col-span-3">
            <div className="w-full space-y-6">
              {!card ? (
                <CardModalDescription.Skeleton />
              ) : (
                <CardModalDescription card={card} />
              )}
              {!cardAuditLogs ? (
                <CardModalActivity.Skeleton />
              ) : (
                <CardModalActivity auditLogs={cardAuditLogs} />
              )}
            </div>
          </div>
          {!card ? (
            <CardModalActions.Skeleton />
          ) : (
            <CardModalActions card={card} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
