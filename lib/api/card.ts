import { queryOptions } from "@tanstack/react-query";
import { type AuditLog } from "@/app/generated/prisma/client";
import { fetcher } from "@/lib/fetcher";
import { type CardWithList } from "@/types";

/**
 * Card remote-data factory for TanStack Query (client).
 * See docs/data.md (TanStack Query) — why lib/api vs app/api and queryOptions.
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
