import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import { mockInteractiveTransaction } from "@/lib/testing/prisma/mock-interactive-transaction";
import { orgAuth } from "@/lib/testing/org-auth";
import { paths } from "@/lib/paths";
import { boardFactory } from "@/lib/testing/factories/board";

import { deleteBoard } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

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

const getOrgAuthMock = vi.mocked(getOrgAuth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);
const createAuditLogMock = vi.mocked(createAuditLog);

const lockedOrgLimitRow = [{}];

describe("deleteBoard", () => {
  beforeEach(() => {
    mockInteractiveTransaction({ transactionMock, txClient });
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const result = await deleteBoard({ id: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("deletes a Free-plan board and frees a slot in the same transaction", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 0 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    txClient.board.delete.mockResolvedValue(board);
    txClient.board.count.mockResolvedValue(4);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });

    await deleteBoard({ id: board.id });

    expect(getOrgAuthMock).toHaveBeenCalledOnce();
    expect(transactionMock).toHaveBeenCalledOnce();

    const order = [
      txClient.organizationLimit.createMany,
      txClient.$queryRaw,
      txClient.board.delete,
      txClient.board.count,
      txClient.organizationLimit.updateMany,
    ].map((m) => m.mock.invocationCallOrder[0]);
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1]!);
    }
    expect(txClient.board.delete).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(txClient.organizationSubscription.findUnique).not.toHaveBeenCalled();
    expect(txClient.board.count).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(
      txClient.organizationLimit.updateMany,
    ).toHaveBeenCalledExactlyOnceWith({
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.delete.mockResolvedValue(board);
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 0 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    txClient.board.count.mockResolvedValue(9);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });

    await deleteBoard({ id: board.id });

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(txClient.organizationSubscription.findUnique).not.toHaveBeenCalled();
    expect(txClient.organizationLimit.updateMany).toHaveBeenCalledOnce();
    expect(txClient.board.delete).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      paths.organization("org_1"),
    );
  });

  test("returns Failed to delete without writing an audit log when decrement throws", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.delete.mockResolvedValue(board);
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 0 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    txClient.board.count.mockResolvedValue(4);
    txClient.organizationLimit.updateMany.mockRejectedValue(
      new Error("db down"),
    );

    const result = await deleteBoard({ id: board.id });

    expect(txClient.board.delete).toHaveBeenCalledOnce();

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });

  test("returns Failed to delete when the board delete throws", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.board.delete.mockRejectedValue(new Error("db down"));

    const result = await deleteBoard({ id: "board_1" });

    expect(txClient.organizationLimit.updateMany).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });
});
