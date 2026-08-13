/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `auditLogFactory` → Prisma `AuditLog` row
 *
 * Pair with a card via transient `{ card }` (or override `entityId` / `entityTitle`).
 * Do not redefine Card factories here — use `./card`.
 */

import { constructNow } from "date-fns";
import { Factory } from "fishery";

import {
  ACTION,
  ENTITY_TYPE,
  type AuditLog,
  type Card,
} from "@/app/generated/prisma/client";

type AuditLogTransientParams = {
  card?: Pick<Card, "id" | "title">;
};

export const auditLogFactory = Factory.define<
  AuditLog,
  AuditLogTransientParams
>(({ sequence, transientParams }) => {
  const card = transientParams.card;
  const instant = constructNow(undefined);

  return {
    id: `auditLog_${sequence}`,
    orgId: "org_1",
    action: ACTION.CREATE,
    // Placeholder entity — override or pass `{ transient: { card } }`.
    entityId: card?.id ?? `card_${sequence}`,
    entityType: ENTITY_TYPE.CARD,
    entityTitle: card?.title ?? "Ship P2",
    userId: "user_1",
    userImage: "https://example.com/avatar.png",
    userName: "Ada Lovelace",
    createdAt: instant,
    updatedAt: instant,
  };
});

export const rewindAuditLogFactory = () => {
  auditLogFactory.rewindSequence();
};
