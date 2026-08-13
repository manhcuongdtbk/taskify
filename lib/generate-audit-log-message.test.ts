import { describe, expect, test } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";

import { generateAuditLogMessage } from "./generate-audit-log-message";

describe("generateAuditLogMessage", () => {
  test.for([
    {
      action: ACTION.CREATE,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: "Ship it",
      expected: 'created card "Ship it"',
    },
    {
      action: ACTION.UPDATE,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: "Backlog",
      expected: 'updated list "Backlog"',
    },
    {
      action: ACTION.DELETE,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: "Launch",
      expected: 'deleted board "Launch"',
    },
  ])(
    "$action $entityType → $expected",
    ({ action, entityType, entityTitle, expected }) => {
      expect(
        generateAuditLogMessage(
          auditLogFactory.build({ action, entityType, entityTitle }),
        ),
      ).toBe(expected);
    },
  );

  test("falls back for unknown actions", () => {
    expect(
      generateAuditLogMessage(
        auditLogFactory.build({
          action: "UNKNOWN" as ACTION,
          entityType: ENTITY_TYPE.CARD,
          entityTitle: "Mystery",
        }),
      ),
    ).toBe('unknown action card "Mystery"');
  });
});
