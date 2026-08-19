import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { boardFactory } from "@/lib/testing/factories/board";
import { listFactory } from "@/lib/testing/factories/list";

import { createList } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    board: { findUnique: vi.fn() },
    list: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

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
const transactionMock = vi.mocked(prisma.$transaction);
const globalQueryRawMock = vi.mocked(prisma.$queryRaw);
const globalBoardFindUniqueMock = vi.mocked(prisma.board.findUnique);
const globalListFindFirstMock = vi.mocked(prisma.list.findFirst);
const globalListCreateMock = vi.mocked(prisma.list.create);
const txQueryRawMock = vi.fn();
const txBoardFindUniqueMock = vi.fn();
const txListFindFirstMock = vi.fn();
const txListCreateMock = vi.fn();
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const expectLockedBoard = (boardId: string) => {
  expect(txQueryRawMock).toHaveBeenCalledOnce();
  const [query, ...values] = txQueryRawMock.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain('FROM "Board"');
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([boardId]);
};

const expectGlobalClientUnused = () => {
  expect(globalQueryRawMock).not.toHaveBeenCalled();
  expect(globalBoardFindUniqueMock).not.toHaveBeenCalled();
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
      const value = await fn({
        $queryRaw: txQueryRawMock,
        board: { findUnique: txBoardFindUniqueMock },
        list: { findFirst: txListFindFirstMock, create: txListCreateMock },
      } as never);
      lastTransactionOutcome = "committed";
      return value;
    } catch (reason) {
      lastTransactionOutcome = "rolledBack";
      throw reason;
    }
  });
};

describe("createList", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await createList({ title: "Todo", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txBoardFindUniqueMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Board not found when the board is not in the org", async () => {
    authMock.mockResolvedValue(orgAuth);
    txBoardFindUniqueMock.mockResolvedValue(null);

    const result = await createList({ title: "Todo", boardId: "board_1" });

    expect(txBoardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: "board_1", orgId: "org_1" },
    });
    expect(txQueryRawMock).not.toHaveBeenCalled();
    expect(txListCreateMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Board not found." });
  });

  test("returns Board not found when the board row lock misses", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    txBoardFindUniqueMock.mockResolvedValue(board);
    txQueryRawMock.mockResolvedValue([]);

    const result = await createList({ title: "Todo", boardId: board.id });

    expectLockedBoard(board.id);
    expect(txListCreateMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
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
    authMock.mockResolvedValue(orgAuth);
    txBoardFindUniqueMock.mockResolvedValue(board);
    txQueryRawMock.mockResolvedValue([{}]);
    txListFindFirstMock.mockResolvedValue(null);
    txListCreateMock.mockResolvedValue(list);

    const result = await createList({ title: list.title, boardId: board.id });

    expect(txBoardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expectLockedBoard(board.id);
    expect(txListFindFirstMock).toHaveBeenCalledExactlyOnceWith({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txListCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: { title: list.title, boardId: board.id, order: 1 },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused();
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
    authMock.mockResolvedValue(orgAuth);
    txBoardFindUniqueMock.mockResolvedValue(board);
    txQueryRawMock.mockResolvedValue([{}]);
    txListFindFirstMock.mockResolvedValue({ order: 3 } as never);
    txListCreateMock.mockRejectedValue(new Error("db down"));

    const result = await createList({ title: "Todo", boardId: board.id });

    expect(txListCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: { title: "Todo", boardId: board.id, order: 4 },
    });
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });
});
