import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import {
  expectGlobalClientUnused,
  mockInteractiveTransaction,
} from "@/lib/testing/prisma/mock-interactive-transaction";
import { expectLockedRow } from "@/lib/testing/prisma/expect-locked-row";
import { orgAuth } from "@/lib/testing/org-auth";
import { cardFactory } from "@/lib/testing/factories/card";
import {
  listFactory,
  listWithCardsOrderedByOrderAscFactory,
} from "@/lib/testing/factories/list";

import { copyList } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/create-audit-log", () => ({
  createAuditLog: vi.fn(),
}));

import { createAuditLog } from "@/lib/create-audit-log";

const getOrgAuthMock = vi.mocked(getOrgAuth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const globalQueryRawMock = vi.mocked(prisma.$queryRaw);
const globalListFindUniqueMock = vi.mocked(prisma.list.findUnique);
const globalListFindFirstMock = vi.mocked(prisma.list.findFirst);
const globalListCreateMock = vi.mocked(prisma.list.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

describe("copyList", () => {
  beforeEach(() => {
    mockInteractiveTransaction({
      transactionMock,
      txClient,
      setLastTransactionOutcome: (outcome) => {
        lastTransactionOutcome = outcome;
      },
    });
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const result = await copyList({ id: "list_1", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.list.findUnique).not.toHaveBeenCalled();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalListFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns List not found when the list is not on the org board", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalListFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "List not found" });
  });

  test("returns List not found when the board row lock misses", async () => {
    const source = listWithCardsOrderedByOrderAscFactory.build({
      boardId: "board_1",
    });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.list.findUnique.mockResolvedValue(source);
    txClient.$queryRaw.mockResolvedValue([]);

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expectLockedRow({
      queryRaw: txClient.$queryRaw,
      table: "Board",
      id: source.boardId,
    });
    expect(txClient.list.create).not.toHaveBeenCalled();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalListFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    expectLockedRow({
      queryRaw: txClient.$queryRaw,
      table: "Board",
      id: source.boardId,
    });
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
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalListFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalListFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
