/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * Fishery factories for card / list / audit-log test data (not `lib/api` Query
 * factories). Match installed fishery — [`docs/conventions.md`](../../docs/conventions.md).
 *
 * Defaults use stable IDs (`card_1`, …) so jsdom/MSW suites stay deterministic.
 * Prefer `sequence` / unique values when a suite needs isolation (e.g. DB).
 */

import { Factory } from "fishery";

import {
  ACTION,
  ENTITY_TYPE,
  type AuditLog,
  type List,
} from "@/app/generated/prisma/client";
import { type CardWithList } from "@/types";

const defaultCreatedAt = new Date("2026-01-01");
const defaultUpdatedAt = new Date("2026-01-01");
const defaultLogAt = new Date("2026-01-15T10:30:00.000Z");

export const listFactory = Factory.define<List>(() => ({
  id: "list_1",
  title: "Todo",
  order: 0,
  boardId: "board_1",
  createdAt: defaultCreatedAt,
  updatedAt: defaultUpdatedAt,
}));

export const cardWithListFactory = Factory.define<CardWithList>(
  ({ associations }) => {
    const list = associations.list ?? listFactory.build();

    return {
      id: "card_1",
      title: "Ship P2",
      description: null,
      order: 0,
      listId: list.id,
      createdAt: defaultCreatedAt,
      updatedAt: defaultUpdatedAt,
      list,
    };
  },
);

export const cardAuditLogFactory = Factory.define<AuditLog>(() => ({
  id: "log_1",
  orgId: "org_1",
  action: ACTION.CREATE,
  entityId: "card_1",
  entityType: ENTITY_TYPE.CARD,
  entityTitle: "Ship P2",
  userId: "user_1",
  userImage: "https://example.com/avatar.png",
  userName: "Ada Lovelace",
  createdAt: defaultLogAt,
  updatedAt: defaultLogAt,
}));
