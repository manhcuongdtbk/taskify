/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * MSW handlers for card detail + card audit-log routes (mirrors `app/api/cards/...`).
 */

import { http, HttpResponse } from "msw";

import { type AuditLog } from "@/app/generated/prisma/client";
import { type CardWithListTitle } from "@/lib/prisma/query-options/card";

import { pendingForever } from "./helpers/pending-forever";

/** Relative paths match `fetcher(\`/api/cards/...\`)` in `lib/api/card`. */
const cardDetailPath = "/api/cards/:cardId" as const;
const cardAuditLogsPath = "/api/cards/:cardId/audit-logs" as const;

export const cardDetailOk = (card: CardWithListTitle | null) =>
  http.get(cardDetailPath, () => HttpResponse.json(card));

export const cardAuditLogsOk = (cardAuditLogs: AuditLog[]) =>
  http.get(cardAuditLogsPath, () => HttpResponse.json(cardAuditLogs));

export const cardDetailUnauthorized = () =>
  http.get(
    cardDetailPath,
    () => new HttpResponse("Unauthorized", { status: 401 }),
  );

export const cardAuditLogsUnauthorized = () =>
  http.get(
    cardAuditLogsPath,
    () => new HttpResponse("Unauthorized", { status: 401 }),
  );

/** Hang forever — keeps the Query pending. See docs/testing.md. */
export const cardDetailPending = () => http.get(cardDetailPath, pendingForever);

/** Hang forever — keeps the card audit-logs Query pending. See docs/testing.md. */
export const cardAuditLogsPending = () =>
  http.get(cardAuditLogsPath, pendingForever);
