import { queryOptions } from "@tanstack/react-query";
import { type AuditLog } from "@/app/generated/prisma/client";
import { fetcher } from "@/lib/fetcher";
import { type CardWithList } from "@/lib/prisma/payloads";

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
      // TODO: root fix belongs in the Route Handler — `app/api/cards/[cardId]`
      // serves findUnique's result, so a deleted or cross-org card arrives as a
      // 200 `null` body instead of a 404. Widening the type here only stops the
      // compiler from lying; drop the `| null` once the route returns 404.
      // See docs/data.md (TODO — clarify / harden data paths).
      queryFn: () => fetcher<CardWithList | null>(`/api/cards/${id}`),
      enabled: !!id,
    }),
  logs: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.byId(id), "logs"] as const,
      queryFn: () => fetcher<AuditLog[]>(`/api/cards/${id}/logs`),
      enabled: !!id,
    }),
};
