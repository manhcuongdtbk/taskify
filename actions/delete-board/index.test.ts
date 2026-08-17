import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { paths } from "@/lib/paths";
import { boardFactory } from "@/lib/testing/factories/board";
import { organizationSubscriptionFactory } from "@/lib/testing/factories/organization-subscription";

import { deleteBoard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $transaction: vi.fn(),
    board: { delete: vi.fn() },
    organizationLimit: {
      updateMany: vi.fn(),
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
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);
const defaultSubscriptionFindUniqueMock = vi.mocked(
  prisma.organizationSubscription.findUnique,
);
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
      board: { delete: boardDeleteMock },
      organizationLimit: {
        updateMany: updateManyMock,
      },
      organizationSubscription: {
        findUnique: txSubscriptionFindUniqueMock,
      },
    } as never);
  });
};

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
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockResolvedValue(board);
    txSubscriptionFindUniqueMock.mockResolvedValue(null);
    updateManyMock.mockResolvedValue({ count: 1 });

    await deleteBoard({ id: board.id });

    expect(authMock).toHaveBeenCalledOnce();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(defaultSubscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(boardDeleteMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(txSubscriptionFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    });
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { gt: 0 } },
      data: { count: { decrement: 1 } },
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

  test("skips the Free-plan slot release for a Pro organization", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockResolvedValue(board);
    txSubscriptionFindUniqueMock.mockResolvedValue(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );

    await deleteBoard({ id: board.id });

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(txSubscriptionFindUniqueMock).toHaveBeenCalledOnce();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(boardDeleteMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      paths.organization("org_1"),
    );
  });

  test("returns Failed to delete without writing an audit log when decrement throws", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    boardDeleteMock.mockResolvedValue(board);
    txSubscriptionFindUniqueMock.mockResolvedValue(null);
    updateManyMock.mockRejectedValue(new Error("db down"));

    const result = await deleteBoard({ id: board.id });

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
