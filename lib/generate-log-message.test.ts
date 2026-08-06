import { describe, expect, test } from "vitest";

import {
  ACTION,
  ENTITY_TYPE,
  type AuditLog,
} from "@/app/generated/prisma/browser";

import { generateLogMessage } from "./generate-log-message";

/**
 * Test-only: supply fields under test. Unused `AuditLog` columns are not part of
 * this suite — cast instead of inventing a full row fixture. Prod stays typed as
 * `AuditLog` (call sites pass real rows). See docs/testing.md (Prisma-related).
 */
function auditLogForMessage(
  fields: Pick<AuditLog, "action" | "entityTitle" | "entityType">,
): AuditLog {
  return fields as AuditLog;
}

describe("generateLogMessage", () => {
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
        generateLogMessage(
          auditLogForMessage({ action, entityType, entityTitle }),
        ),
      ).toBe(expected);
    },
  );

  test("falls back for unknown actions", () => {
    expect(
      generateLogMessage(
        auditLogForMessage({
          action: "UNKNOWN" as ACTION,
          entityType: ENTITY_TYPE.CARD,
          entityTitle: "Mystery",
        }),
      ),
    ).toBe('unknown action card "Mystery"');
  });
});
