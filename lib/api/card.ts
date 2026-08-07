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
  /**
   * Scope for one card — prefix of every leaf key below it. Invalidate this
   * once after a write; each leaf carries its own terminal segment so no key
   * doubles as both a query and a scope (which would refetch leaves twice).
   */
  byId: (id: string | undefined) => [...cardQueries.all(), id] as const,
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.byId(id), "detail"] as const,
      queryFn: () => fetcher<CardWithList>(`/api/cards/${id}`),
      enabled: !!id,
    }),
  logs: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.byId(id), "logs"] as const,
      queryFn: () => fetcher<AuditLog[]>(`/api/cards/${id}/logs`),
      enabled: !!id,
    }),
};
