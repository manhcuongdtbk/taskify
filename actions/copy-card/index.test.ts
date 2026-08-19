import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma";
import { cardFactory } from "@/lib/testing/factories/card";

import { copyCard } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/create-audit-log", () => ({
  createAuditLog: vi.fn(),
}));

import { createAuditLog } from "@/lib/create-audit-log";

const authMock = vi.mocked(auth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const globalQueryRawMock = vi.mocked(prisma.$queryRaw);
const globalCardFindUniqueMock = vi.mocked(prisma.card.findUnique);
const globalCardFindFirstMock = vi.mocked(prisma.card.findFirst);
const globalCardCreateMock = vi.mocked(prisma.card.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const expectLockedList = (listId: string) => {
  expect(txClient.$queryRaw).toHaveBeenCalledOnce();
  const [query, ...values] = txClient.$queryRaw.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain('FROM "List"');
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([listId]);
};

const expectGlobalClientUnused = () => {
  expect(globalQueryRawMock).not.toHaveBeenCalled();
  expect(globalCardFindUniqueMock).not.toHaveBeenCalled();
  expect(globalCardFindFirstMock).not.toHaveBeenCalled();
  expect(globalCardCreateMock).not.toHaveBeenCalled();
};

const mockInteractiveTransaction = () => {
  lastTransactionOutcome = undefined;
  transactionMock.mockImplementation(async (fn) => {
    if (typeof fn !== "function") {
      throw new Error("expected interactive $transaction");
    }

    try {
      const value = await fn(txClient);
      lastTransactionOutcome = "committed";
      return value;
    } catch (reason) {
      lastTransactionOutcome = "rolledBack";
      throw reason;
    }
  });
};

describe("copyCard", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.card.findUnique).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Card not found when the card is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(null);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(txClient.card.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "card_1",
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expect(txClient.$queryRaw).not.toHaveBeenCalled();
    expect(txClient.card.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Card not found" });
  });

  test("returns Card not found when the list row lock misses", async () => {
    const source = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([]);

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expectLockedList(source.listId);
    expect(txClient.card.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Card not found" });
  });

  test("copies a card that belongs to the org board", async () => {
    const source = cardFactory.build({
      title: "Ship P2",
      description: "Notes",
    });
    const copy = cardFactory.build({
      title: "Ship P2 (Copy)",
      listId: source.listId,
    });
    authMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.card.findFirst.mockResolvedValue(null);
    txClient.card.create.mockResolvedValue(copy);

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expect(txClient.card.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: source.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expectLockedList(source.listId);
    expect(txClient.card.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { listId: source.listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txClient.card.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: "Ship P2 (Copy)",
        description: source.description,
        order: 1,
        listId: source.listId,
      },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: copy.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: copy.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: copy });
  });

  test("returns Failed to copy when the card insert throws", async () => {
    const source = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    txClient.card.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.card.findFirst.mockResolvedValue(cardFactory.build({ order: 2 }));
    txClient.card.create.mockRejectedValue(new Error("db down"));

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
