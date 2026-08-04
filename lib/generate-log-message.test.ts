import { describe, expect, test } from "vitest";

import {
  ACTION,
  ENTITY_TYPE,
  type AuditLog,
} from "@/app/generated/prisma/browser";

import { generateLogMessage } from "./generate-log-message";

function auditLog(
  overrides: Pick<AuditLog, "action" | "entityTitle" | "entityType">,
): AuditLog {
  return {
    id: "log_1",
    orgId: "org_1",
    entityId: "entity_1",
    userId: "user_1",
    userImage: "https://example.com/avatar.png",
    userName: "Ada",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
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
        generateLogMessage(auditLog({ action, entityType, entityTitle })),
      ).toBe(expected);
    },
  );

  test("falls back for unknown actions", () => {
    expect(
      generateLogMessage(
        auditLog({
          action: "UNKNOWN" as ACTION,
          entityType: ENTITY_TYPE.CARD,
          entityTitle: "Mystery",
        }),
      ),
    ).toBe('unknown action card "Mystery"');
  });
});
