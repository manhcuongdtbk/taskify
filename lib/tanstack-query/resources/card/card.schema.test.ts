import { describe, expect, test } from "vitest";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
import { jsonBody } from "@/lib/testing/json-body";

import {
  CardAuditLogsJsonSchema,
  CardWithListTitleJsonSchema,
} from "./card.schema";

describe("CardWithListTitleJsonSchema", () => {
  test("maps JSON ISO datetimes to Date", () => {
    const card = cardWithListTitleFactory.build();

    expect(CardWithListTitleJsonSchema.parse(jsonBody(card))).toStrictEqual(
      card,
    );
  });

  test("rejects a partial card", () => {
    expect(
      CardWithListTitleJsonSchema.safeParse({ id: "card_1" }).success,
    ).toBe(false);
  });
});

describe("CardAuditLogsJsonSchema", () => {
  test("maps JSON ISO datetimes to Date", () => {
    const auditLog = auditLogFactory.build();

    expect(CardAuditLogsJsonSchema.parse(jsonBody([auditLog]))).toStrictEqual([
      auditLog,
    ]);
  });

  test("rejects a partial audit log", () => {
    expect(
      CardAuditLogsJsonSchema.safeParse([{ id: "auditLog_1" }]).success,
    ).toBe(false);
  });
});
