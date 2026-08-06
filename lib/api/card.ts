import { queryOptions } from "@tanstack/react-query";
import { type AuditLog } from "@/app/generated/prisma/client";
import { fetcher } from "@/lib/fetcher";
import { type CardWithList } from "@/types";

/**
 * Client Query factory for card remote data (any origin via fetcher).
 * Co-locate queryKey + queryFn; add cardMutations here when Query owns writes.
 * Not Route Handlers — those live under `app/api/`.
 */
export const cardQueries = {
  all: () => ["card"] as const,
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.all(), id] as const,
      queryFn: () => fetcher<CardWithList>(`/api/cards/${id}`),
      enabled: !!id,
    }),
  logs: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.all(), id, "logs"] as const,
      queryFn: () => fetcher<AuditLog[]>(`/api/cards/${id}/logs`),
      enabled: !!id,
    }),
};
