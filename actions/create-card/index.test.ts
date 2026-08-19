import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma";
import { cardFactory } from "@/lib/testing/factories/card";
import { listFactory } from "@/lib/testing/factories/list";

import { createCard } from "./index";

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
const globalListFindUniqueMock = vi.mocked(prisma.list.findUnique);
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
  expect(globalListFindUniqueMock).not.toHaveBeenCalled();
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

describe("createCard", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await createCard({
      title: "Ship P2",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.list.findUnique).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns List not found when the list is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(null);

    const result = await createCard({
      title: "Ship P2",
      boardId: "board_1",
      listId: "list_1",
    });

    expect(txClient.list.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "list_1",
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
    });
    expect(txClient.$queryRaw).not.toHaveBeenCalled();
    expect(txClient.card.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "List not found." });
  });

  test("returns List not found when the list row lock misses", async () => {
    const list = listFactory.build({ boardId: "board_1" });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(list);
    txClient.$queryRaw.mockResolvedValue([]);

    const result = await createCard({
      title: "Ship P2",
      boardId: list.boardId,
      listId: list.id,
    });

    expectLockedList(list.id);
    expect(txClient.card.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "List not found." });
  });

  test("creates a card on a list that belongs to the org board", async () => {
    const list = listFactory.build({ boardId: "board_1" });
    const card = cardFactory.build({ listId: list.id, title: "Ship P2" });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(list);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.card.findFirst.mockResolvedValue(null);
    txClient.card.create.mockResolvedValue(card);

    const result = await createCard({
      title: card.title,
      boardId: list.boardId,
      listId: list.id,
    });

    expect(txClient.list.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: list.id,
        boardId: list.boardId,
        board: { orgId: "org_1" },
      },
    });
    expectLockedList(list.id);
    expect(txClient.card.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { listId: list.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txClient.card.create).toHaveBeenCalledExactlyOnceWith({
      data: { title: card.title, listId: list.id, order: 1 },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${list.boardId}`,
    );
    expect(result).toStrictEqual({ data: card });
  });

  test("returns Failed to create when the card insert throws", async () => {
    const list = listFactory.build({ boardId: "board_1" });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(list);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.card.findFirst.mockResolvedValue(cardFactory.build({ order: 3 }));
    txClient.card.create.mockRejectedValue(new Error("db down"));

    const result = await createCard({
      title: "Ship P2",
      boardId: list.boardId,
      listId: list.id,
    });

    expect(txClient.card.create).toHaveBeenCalledExactlyOnceWith({
      data: { title: "Ship P2", listId: list.id, order: 4 },
    });
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });
});
