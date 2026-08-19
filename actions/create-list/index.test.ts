import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { orgAuth } from "@/lib/testing/org-auth";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import {
  expectGlobalClientUnused,
  mockInteractiveTransaction,
} from "@/lib/testing/prisma/mock-interactive-transaction";
import { expectLockedRow } from "@/lib/testing/prisma/expect-locked-row";
import { boardFactory } from "@/lib/testing/factories/board";
import { listFactory } from "@/lib/testing/factories/list";

import { createList } from "./index";

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
const globalBoardFindUniqueMock = vi.mocked(prisma.board.findUnique);
const globalListFindFirstMock = vi.mocked(prisma.list.findFirst);
const globalListCreateMock = vi.mocked(prisma.list.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

describe("createList", () => {
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

    const result = await createList({ title: "Todo", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.board.findUnique).not.toHaveBeenCalled();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalBoardFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Board not found when the board is not in the org", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.findUnique.mockResolvedValue(null);

    const result = await createList({ title: "Todo", boardId: "board_1" });

    expect(txClient.board.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: "board_1", orgId: "org_1" },
    });
    expect(txClient.$queryRaw).not.toHaveBeenCalled();
    expect(txClient.list.create).not.toHaveBeenCalled();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalBoardFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Board not found." });
  });

  test("returns Board not found when the board row lock misses", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.findUnique.mockResolvedValue(board);
    txClient.$queryRaw.mockResolvedValue([]);

    const result = await createList({ title: "Todo", boardId: board.id });

    expectLockedRow({
      queryRaw: txClient.$queryRaw,
      table: "Board",
      id: board.id,
    });
    expect(txClient.list.create).not.toHaveBeenCalled();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalBoardFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Board not found." });
  });

  test("creates a list on a board that belongs to the org", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    const list = listFactory.build({
      boardId: board.id,
      title: "Todo",
      order: 1,
    });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.findUnique.mockResolvedValue(board);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.list.findFirst.mockResolvedValue(null);
    txClient.list.create.mockResolvedValue(list);

    const result = await createList({ title: list.title, boardId: board.id });

    expect(txClient.board.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expectLockedRow({
      queryRaw: txClient.$queryRaw,
      table: "Board",
      id: board.id,
    });
    expect(txClient.list.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txClient.list.create).toHaveBeenCalledExactlyOnceWith({
      data: { title: list.title, boardId: board.id, order: 1 },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalBoardFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("committed");
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${board.id}`,
    );
    expect(result).toStrictEqual({ data: list });
  });

  test("returns Failed to create when the list insert throws", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.findUnique.mockResolvedValue(board);
    txClient.$queryRaw.mockResolvedValue([{}]);
    txClient.list.findFirst.mockResolvedValue(listFactory.build({ order: 3 }));
    txClient.list.create.mockRejectedValue(new Error("db down"));

    const result = await createList({ title: "Todo", boardId: board.id });

    expect(txClient.list.create).toHaveBeenCalledExactlyOnceWith({
      data: { title: "Todo", boardId: board.id, order: 4 },
    });
    expectGlobalClientUnused(
      globalQueryRawMock,
      globalBoardFindUniqueMock,
      globalListFindFirstMock,
      globalListCreateMock,
    );
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });
});
