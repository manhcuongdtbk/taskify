import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma";
import { cardFactory } from "@/lib/testing/factories/card";
import {
  listFactory,
  listWithCardsOrderedByOrderAscFactory,
} from "@/lib/testing/factories/list";

import { copyList } from "./index";

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
const globalListFindFirstMock = vi.mocked(prisma.list.findFirst);
const globalListCreateMock = vi.mocked(prisma.list.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const expectLockedBoard = (boardId: string) => {
  expect(txClient.$queryRaw).toHaveBeenCalledOnce();
  const [query, ...values] = txClient.$queryRaw.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain('FROM "Board"');
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([boardId]);
};

const expectGlobalClientUnused = () => {
  expect(globalQueryRawMock).not.toHaveBeenCalled();
  expect(globalListFindUniqueMock).not.toHaveBeenCalled();
  expect(globalListFindFirstMock).not.toHaveBeenCalled();
  expect(globalListCreateMock).not.toHaveBeenCalled();
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

describe("copyList", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await copyList({ id: "list_1", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.list.findUnique).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns List not found when the list is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(null);

    const result = await copyList({ id: "list_1", boardId: "board_1" });

    expect(txClient.list.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "list_1",
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
      include: { cards: true },
    });
    expect(txClient.$queryRaw).not.toHaveBeenCalled();
    expect(txClient.list.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "List not found" });
  });

  test("returns List not found when the board row lock misses", async () => {
    const source = listWithCardsOrderedByOrderAscFactory.build({
      boardId: "board_1",
    });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([]);

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expectLockedBoard(source.boardId);
    expect(txClient.list.create).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "List not found" });
  });

  test("copies a list that belongs to the org board", async () => {
    const card = cardFactory.build({
      title: "Ship P2",
      description: "Notes",
      order: 0,
    });
    const source = listWithCardsOrderedByOrderAscFactory.build(
      { title: "Todo", boardId: "board_1" },
      { associations: { cards: [card] } },
    );
    const copy = listWithCardsOrderedByOrderAscFactory.build({
      title: source.title,
      boardId: source.boardId,
      order: 1,
    });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.list.findFirst.mockResolvedValue(null);
    txClient.list.create.mockResolvedValue(copy);

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expect(txClient.list.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: source.id,
        boardId: source.boardId,
        board: { orgId: "org_1" },
      },
      include: { cards: true },
    });
    expectLockedBoard(source.boardId);
    expect(txClient.list.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { boardId: source.boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txClient.list.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: source.title,
        boardId: source.boardId,
        order: 1,
        cards: {
          createMany: {
            data: [
              {
                title: card.title,
                description: card.description,
                order: card.order,
              },
            ],
          },
        },
      },
      include: { cards: true },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: copy.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: copy.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${source.boardId}`,
    );
    expect(result).toStrictEqual({ data: copy });
  });

  test("returns Failed to copy when the list insert throws", async () => {
    const source = listWithCardsOrderedByOrderAscFactory.build({
      boardId: "board_1",
    });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.list.findFirst.mockResolvedValue(listFactory.build({ order: 2 }));
    txClient.list.create.mockRejectedValue(new Error("db down"));

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expect(txClient.list.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: source.title,
        boardId: source.boardId,
        order: 3,
        cards: {
          createMany: {
            data: [],
          },
        },
      },
      include: { cards: true },
    });
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
