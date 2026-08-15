"use client";

import { type AuditLog } from "@/app/generated/prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cardQueries } from "@/lib/api/card";
import { type CardWithListTitle } from "@/lib/prisma/query-options/card";
import {
  selectCardModalIsOpen,
  useCardModalStore,
} from "@/stores/use-card-modal-store";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { CardModalHeader } from "./card-modal-header";
import { CardModalDescription } from "./card-modal-description";
import { CardModalActions } from "./card-modal-actions";
import { CardModalActivity } from "./card-modal-activity";

const cardLoadErrorCopy = "Couldn't load this card";
const cardActivityLoadErrorCopy = "Couldn't load activity";

const CardModalLoadError = ({ children }: { children: string }) => {
  return (
    <p role="alert" className="text-sm text-neutral-600">
      {children}
    </p>
  );
};

const CardModalHeaderStatus = ({
  query,
}: {
  query: UseQueryResult<CardWithListTitle>;
}) => {
  if (query.isPending) {
    return <CardModalHeader.Skeleton />;
  }

  if (query.isError) {
    return <CardModalLoadError>{cardLoadErrorCopy}</CardModalLoadError>;
  }

  return <CardModalHeader card={query.data} />;
};

const CardModalDescriptionStatus = ({
  query,
}: {
  query: UseQueryResult<CardWithListTitle>;
}) => {
  if (query.isPending) {
    return <CardModalDescription.Skeleton />;
  }

  if (query.isError) {
    return null;
  }

  return <CardModalDescription card={query.data} />;
};

const CardModalActionsStatus = ({
  query,
}: {
  query: UseQueryResult<CardWithListTitle>;
}) => {
  if (query.isPending) {
    return <CardModalActions.Skeleton />;
  }

  if (query.isError) {
    return null;
  }

  return <CardModalActions card={query.data} />;
};

const CardModalActivityStatus = ({
  query,
}: {
  query: UseQueryResult<AuditLog[]>;
}) => {
  if (query.isPending) {
    return <CardModalActivity.Skeleton />;
  }

  if (query.isError) {
    return <CardModalLoadError>{cardActivityLoadErrorCopy}</CardModalLoadError>;
  }

  return <CardModalActivity auditLogs={query.data} />;
};

export const CardModal = () => {
  const id = useCardModalStore((state) => state.id);
  const isOpen = useCardModalStore(selectCardModalIsOpen);
  const handleClose = useCardModalStore((state) => state.close);

  const cardQuery = useQuery(cardQueries.detail(id));
  const cardAuditLogsQuery = useQuery(cardQueries.auditLogs(id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        <CardModalHeaderStatus query={cardQuery} />
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="col-span-3">
            <div className="w-full space-y-6">
              <CardModalDescriptionStatus query={cardQuery} />
              <CardModalActivityStatus query={cardAuditLogsQuery} />
            </div>
          </div>
          <CardModalActionsStatus query={cardQuery} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
