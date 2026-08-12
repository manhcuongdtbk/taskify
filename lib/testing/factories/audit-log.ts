/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `auditLogFactory` → Prisma `AuditLog` row
 *
 * Pair with a card via transient `{ card }` (or override `entityId` / `entityTitle`).
 * Do not redefine Card factories here — use `./card`.
 */

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
  // First persist: createdAt === updatedAt (Prisma @default(now()) + @updatedAt).
  const now = new Date();
  const card = transientParams.card;

  return {
    id: `log_${sequence}`,
    orgId: "org_1",
    action: ACTION.CREATE,
    // Placeholder entity — override or pass `{ transient: { card } }`.
    entityId: card?.id ?? `card_${sequence}`,
    entityType: ENTITY_TYPE.CARD,
    entityTitle: card?.title ?? "Ship P2",
    userId: "user_1",
    userImage: "https://example.com/avatar.png",
    userName: "Ada Lovelace",
    createdAt: now,
    updatedAt: now,
  };
});

export const rewindAuditLogFactory = () => {
  auditLogFactory.rewindSequence();
};
