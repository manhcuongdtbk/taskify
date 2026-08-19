import { queryOptions } from "@tanstack/react-query";

import { fetcher } from "@/lib/tanstack-query/fetcher";

import {
  CardAuditLogsJsonSchema,
  CardWithListTitleJsonSchema,
} from "./card.schema";

/**
 * Card remote-data factory for TanStack Query (client).
 * See docs/data.md (TanStack Query) — lib/tanstack-query vs app/api and queryOptions.
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
      queryFn: () => fetcher(`/api/cards/${id}`, CardWithListTitleJsonSchema),
      enabled: !!id,
    }),
  auditLogs: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.byId(id), "auditLogs"] as const,
      queryFn: () =>
        fetcher(`/api/cards/${id}/audit-logs`, CardAuditLogsJsonSchema),
      enabled: !!id,
    }),
};
