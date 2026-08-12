import { beforeEach, describe, expect, test } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

import { auditLogFactory, rewindAuditLogFactory } from "./audit-log";
import { cardFactory, rewindCardFactory } from "./card";

describe("auditLogFactory", () => {
  beforeEach(() => {
    rewindAuditLogFactory();
    rewindCardFactory();
  });

  test("builds an AuditLog with sequenced defaults", () => {
    expect(auditLogFactory.build()).toMatchObject({
      id: "log_1",
      action: ACTION.CREATE,
      entityType: ENTITY_TYPE.CARD,
      entityId: "card_1",
      entityTitle: "Ship P2",
      userName: "Ada Lovelace",
    });
  });

  test("pairs entity fields from a transient card", () => {
    const card = cardFactory.build({ title: "Renamed" });
    const log = auditLogFactory.build(
      { action: ACTION.UPDATE },
      { transient: { card } },
    );

    expect(log.entityTitle).toBe("Renamed");
    expect(log.action).toBe(ACTION.UPDATE);
    expect(log.entityId).toBe(card.id);
  });

  test("explicit entity overrides win over transient card", () => {
    const card = cardFactory.build({ title: "From card" });
    const log = auditLogFactory.build(
      { entityTitle: "Explicit", entityId: "card_explicit" },
      { transient: { card } },
    );

    // Fishery overlays params on the returned object after the factory runs.
    expect(log.entityTitle).toBe("Explicit");
    expect(log.entityId).toBe("card_explicit");
  });
});
