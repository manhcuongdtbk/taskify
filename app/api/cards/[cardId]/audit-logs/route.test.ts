import { ENTITY_TYPE } from "@/app/generated/prisma/client";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import { mockInteractiveTransaction } from "@/lib/testing/prisma/mock-interactive-transaction";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardFactory } from "@/lib/testing/factories/card";
import { orgAuth } from "@/lib/testing/org-auth";
import { jsonBody } from "@/lib/testing/json-body";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { GET } from "./route";

const getOrgAuthMock = vi.mocked(getOrgAuth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const notFoundMock = vi.mocked(notFound);

const request = new NextRequest("http://localhost/api/cards/card_1/audit-logs");

const contextFor = (cardId: string) => ({
  params: Promise.resolve({ cardId }),
});

describe("GET /api/cards/[cardId]/audit-logs", () => {
  test("returns 401 without querying when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const response = await GET(request, contextFor("card_1"));

    expect(transactionMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("returns card audit logs when the card exists in this org", async () => {
    const card = cardFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(card);
    txClient.auditLog.findMany.mockResolvedValue([cardAuditLog]);
    mockInteractiveTransaction({ transactionMock, txClient });

    const response = await GET(request, contextFor(card.id));

    expect(txClient.card.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(txClient.auditLog.findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        orgId: "org_1",
        entityId: card.id,
        entityType: ENTITY_TYPE.CARD,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(jsonBody([cardAuditLog]));
  });

  test("returns an empty list when the card exists and has no card audit logs", async () => {
    const card = cardFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(card);
    txClient.auditLog.findMany.mockResolvedValue([]);
    mockInteractiveTransaction({ transactionMock, txClient });

    const response = await GET(request, contextFor(card.id));

    expect(txClient.card.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(txClient.auditLog.findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        orgId: "org_1",
        entityId: card.id,
        entityType: ENTITY_TYPE.CARD,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual([]);
  });

  test("calls notFound without loading card audit logs when the card is missing or in another org", async () => {
    const card = cardFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(null);
    mockInteractiveTransaction({ transactionMock, txClient });

    const error = await GET(request, contextFor(card.id)).then(
      () => {
        throw new Error("expected GET to reject");
      },
      (reason: unknown) => reason,
    );

    expect(txClient.card.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(txClient.auditLog.findMany).not.toHaveBeenCalled();
    expect(notFoundMock).toHaveBeenCalledOnce();
    expect(error).toMatchObject({ message: "NEXT_NOT_FOUND" });
  });
});
