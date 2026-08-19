import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { paths } from "@/lib/paths";
import { boardFactory } from "@/lib/testing/factories/board";

import { deleteBoard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    board: { delete: vi.fn(), count: vi.fn() },
    organizationLimit: {
      updateMany: vi.fn(),
      createMany: vi.fn(),
    },
    organizationSubscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/create-audit-log", () => ({
  createAuditLog: vi.fn(),
}));

import { createAuditLog } from "@/lib/create-audit-log";

const authMock = vi.mocked(auth);
const transactionMock = vi.mocked(prisma.$transaction);
const boardDeleteMock = vi.mocked(prisma.board.delete);
const boardCountMock = vi.mocked(prisma.board.count);
const queryRawMock = vi.mocked(prisma.$queryRaw);
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);
const createManyMock = vi.mocked(prisma.organizationLimit.createMany);
const txSubscriptionFindUniqueMock = vi.fn();
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);
const createAuditLogMock = vi.mocked(createAuditLog);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const mockInteractiveTransaction = () => {
  transactionMock.mockImplementation(async (fn) => {
    if (typeof fn !== "function") {
      throw new Error("expected interactive $transaction");
    }

    return fn({
      $queryRaw: queryRawMock,
      board: { delete: boardDeleteMock, count: boardCountMock },
      organizationLimit: {
        updateMany: updateManyMock,
        createMany: createManyMock,
      },
      organizationSubscription: {
        findUnique: txSubscriptionFindUniqueMock,
      },
    } as never);
  });
};

const lockedOrgLimitRow = [{}];

describe("deleteBoard", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await deleteBoard({ id: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("deletes a Free-plan board and frees a slot in the same transaction", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    const callOrder: string[] = [];
    authMock.mockResolvedValue(orgAuth);
    createManyMock.mockImplementation(async () => {
      callOrder.push("lock");
      return { count: 0 };
    });
    queryRawMock.mockImplementation(async () => {
      callOrder.push("lock-for-update");
      return lockedOrgLimitRow;
    });
    boardDeleteMock.mockImplementation(async () => {
      callOrder.push("delete");
      return board;
    });
    boardCountMock.mockImplementation(async () => {
      callOrder.push("count");
      return 4;
    });
    updateManyMock.mockImplementation(async () => {
      callOrder.push("sync");
      return { count: 1 };
    });

    await deleteBoard({ id: board.id });

    expect(authMock).toHaveBeenCalledOnce();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(callOrder).toStrictEqual([
      "lock",
      "lock-for-update",
      "delete",
      "count",
      "sync",
    ]);
    expect(boardDeleteMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(txSubscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(boardCountMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 4 },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.DELETE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      paths.organization("org_1"),
    );
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      paths.organization("org_1"),
    );
  });

  test("decrements the stored counter for a Pro organization", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockResolvedValue(board);
    createManyMock.mockResolvedValue({ count: 0 });
    queryRawMock.mockResolvedValue(lockedOrgLimitRow);
    boardCountMock.mockResolvedValue(9);
    updateManyMock.mockResolvedValue({ count: 1 });

    await deleteBoard({ id: board.id });

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(txSubscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).toHaveBeenCalledOnce();
    expect(boardDeleteMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      paths.organization("org_1"),
    );
  });

  test("returns Failed to delete without writing an audit log when decrement throws", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockResolvedValue(board);
    createManyMock.mockResolvedValue({ count: 0 });
    queryRawMock.mockResolvedValue(lockedOrgLimitRow);
    boardCountMock.mockResolvedValue(4);
    updateManyMock.mockRejectedValue(new Error("db down"));

    const result = await deleteBoard({ id: board.id });

    expect(boardDeleteMock).toHaveBeenCalledOnce();

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });

  test("returns Failed to delete when the board delete throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockRejectedValue(new Error("db down"));

    const result = await deleteBoard({ id: "board_1" });

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });
});
