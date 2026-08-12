/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * MSW handlers for card detail + audit-log routes (mirrors `app/api/cards/...`).
 */

import { http, HttpResponse } from "msw";

import { type AuditLog } from "@/app/generated/prisma/client";
import { type CardWithList } from "@/lib/prisma/payloads";

/** Relative paths match `fetcher(\`/api/cards/...\`)` in `lib/api/card.ts`. */
export const cardDetailPath = "/api/cards/:cardId" as const;
export const cardLogsPath = "/api/cards/:cardId/logs" as const;

export const cardDetailOk = (card: CardWithList | null) =>
  http.get(cardDetailPath, () => HttpResponse.json(card));

export const cardLogsOk = (logs: AuditLog[]) =>
  http.get(cardLogsPath, () => HttpResponse.json(logs));

export const cardDetailUnauthorized = () =>
  http.get(
    cardDetailPath,
    () => new HttpResponse("Unauthorized", { status: 401 }),
  );

export const cardLogsUnauthorized = () =>
  http.get(
    cardLogsPath,
    () => new HttpResponse("Unauthorized", { status: 401 }),
  );

/** Never resolves — keeps the Query in a pending state. */
export const cardDetailPending = () =>
  http.get(cardDetailPath, () => new Promise<Response>(() => {}));

/** Never resolves — keeps the logs Query in a pending state. */
export const cardLogsPending = () =>
  http.get(cardLogsPath, () => new Promise<Response>(() => {}));
