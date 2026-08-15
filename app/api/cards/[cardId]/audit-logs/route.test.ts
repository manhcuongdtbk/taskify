import { ENTITY_TYPE } from "@/app/generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { cardFactory } from "@/lib/testing/factories/card";
import { jsonBody } from "@/lib/testing/json-body";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { GET } from "./route";

const authMock = vi.mocked(auth);
const transactionMock = vi.mocked(prisma.$transaction);
const notFoundMock = vi.mocked(notFound);
const findUniqueMock = vi.fn();
const findManyMock = vi.fn();

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const request = new NextRequest("http://localhost/api/cards/card_1/audit-logs");

const contextFor = (cardId: string) => ({
  params: Promise.resolve({ cardId }),
});

const mockInteractiveTransaction = () => {
  transactionMock.mockImplementation(async (fn) => {
    if (typeof fn !== "function") {
      throw new Error("expected interactive $transaction");
    }

    return fn({
      card: { findUnique: findUniqueMock },
      auditLog: { findMany: findManyMock },
    } as never);
  });
};

describe("GET /api/cards/[cardId]/audit-logs", () => {
  test("returns 401 without querying when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const response = await GET(request, contextFor("card_1"));

    expect(transactionMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("returns card audit logs when the card exists in this org", async () => {
    const card = cardFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue({ id: card.id });
    findManyMock.mockResolvedValue([cardAuditLog]);
    mockInteractiveTransaction();

    const response = await GET(request, contextFor(card.id));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(findManyMock).toHaveBeenCalledExactlyOnceWith({
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
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue({ id: card.id });
    findManyMock.mockResolvedValue([]);
    mockInteractiveTransaction();

    const response = await GET(request, contextFor(card.id));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(findManyMock).toHaveBeenCalledExactlyOnceWith({
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
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);
    mockInteractiveTransaction();

    const error = await GET(request, contextFor(card.id)).then(
      () => {
        throw new Error("expected GET to reject");
      },
      (reason: unknown) => reason,
    );

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      select: { id: true },
    });
    expect(findManyMock).not.toHaveBeenCalled();
    expect(notFoundMock).toHaveBeenCalledOnce();
    expect(error).toMatchObject({ message: "NEXT_NOT_FOUND" });
  });
});
