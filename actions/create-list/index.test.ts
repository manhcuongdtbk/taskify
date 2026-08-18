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
const boardFindUniqueMock = vi.mocked(prisma.board.findUnique);
const listFindFirstMock = vi.mocked(prisma.list.findFirst);
const listCreateMock = vi.mocked(prisma.list.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const mockInteractiveTransaction = () => {
  lastTransactionOutcome = undefined;
  transactionMock.mockImplementation(async (fn) => {
    if (typeof fn !== "function") {
      throw new Error("expected interactive $transaction");
    }

    try {
      const value = await fn({
        board: { findUnique: boardFindUniqueMock },
        list: { findFirst: listFindFirstMock, create: listCreateMock },
      });
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
    expect(boardFindUniqueMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Board not found when the board is not in the org", async () => {
    authMock.mockResolvedValue(orgAuth);
    boardFindUniqueMock.mockResolvedValue(null);

    const result = await createList({ title: "Todo", boardId: "board_1" });

    expect(boardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: "board_1", orgId: "org_1" },
    });
    expect(listCreateMock).not.toHaveBeenCalled();
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
    boardFindUniqueMock.mockResolvedValue(board);
    listFindFirstMock.mockResolvedValue(null);
    listCreateMock.mockResolvedValue(list);

    const result = await createList({ title: list.title, boardId: board.id });

    expect(boardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(listFindFirstMock).toHaveBeenCalledExactlyOnceWith({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(listCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: { title: list.title, boardId: board.id, order: 1 },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
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
    boardFindUniqueMock.mockResolvedValue(board);
    listFindFirstMock.mockResolvedValue({ order: 3 } as never);
    listCreateMock.mockRejectedValue(new Error("db down"));

    const result = await createList({ title: "Todo", boardId: board.id });

    expect(listCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: { title: "Todo", boardId: board.id, order: 4 },
    });
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });
});
