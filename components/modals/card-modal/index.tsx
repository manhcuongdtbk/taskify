"use client";

import { type AuditLog } from "@/app/generated/prisma/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cardQueries } from "@/lib/tanstack-query/resources/card";
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

const cardModalTitle = "Card details";
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
  cardQuery,
}: {
  cardQuery: UseQueryResult<CardWithListTitle>;
}) => {
  if (cardQuery.isPending) {
    return <CardModalHeader.Skeleton />;
  }

  if (cardQuery.isError) {
    return <CardModalLoadError>{cardLoadErrorCopy}</CardModalLoadError>;
  }

  return <CardModalHeader key={cardQuery.data.id} card={cardQuery.data} />;
};

const CardModalDescriptionStatus = ({
  cardQuery,
}: {
  cardQuery: UseQueryResult<CardWithListTitle>;
}) => {
  if (cardQuery.isPending) {
    return <CardModalDescription.Skeleton />;
  }

  if (cardQuery.isError) {
    return null;
  }

  return <CardModalDescription key={cardQuery.data.id} card={cardQuery.data} />;
};

const CardModalActionsStatus = ({
  cardQuery,
}: {
  cardQuery: UseQueryResult<CardWithListTitle>;
}) => {
  if (cardQuery.isPending) {
    return <CardModalActions.Skeleton />;
  }

  if (cardQuery.isError) {
    return null;
  }

  return <CardModalActions key={cardQuery.data.id} card={cardQuery.data} />;
};

const CardModalActivityStatus = ({
  cardQuery,
  cardAuditLogsQuery,
}: {
  cardQuery: UseQueryResult<CardWithListTitle>;
  cardAuditLogsQuery: UseQueryResult<AuditLog[]>;
}) => {
  if (cardQuery.isError) {
    return null;
  }

  if (cardQuery.isPending || cardAuditLogsQuery.isPending) {
    return <CardModalActivity.Skeleton />;
  }

  if (cardAuditLogsQuery.isError) {
    return <CardModalLoadError>{cardActivityLoadErrorCopy}</CardModalLoadError>;
  }

  return (
    <CardModalActivity
      key={cardQuery.data.id}
      auditLogs={cardAuditLogsQuery.data}
    />
  );
};

export const CardModal = () => {
  const id = useCardModalStore((state) => state.id);
  const isOpen = useCardModalStore(selectCardModalIsOpen);
  const handleClose = useCardModalStore((state) => state.close);

  const cardQuery = useQuery(cardQueries.detail(id));
  const cardAuditLogsQuery = useQuery(cardQueries.auditLogs(id));
  const dialogTitle =
    cardQuery.isSuccess && cardQuery.data.title
      ? cardQuery.data.title
      : cardModalTitle;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <CardModalHeaderStatus cardQuery={cardQuery} />
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="col-span-3">
            <div className="w-full space-y-6">
              <CardModalDescriptionStatus cardQuery={cardQuery} />
              <CardModalActivityStatus
                cardQuery={cardQuery}
                cardAuditLogsQuery={cardAuditLogsQuery}
              />
            </div>
          </div>
          <CardModalActionsStatus cardQuery={cardQuery} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
