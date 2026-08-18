import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { FREE_BOARD_LIMIT_SERVER_ERROR } from "@/lib/errors/free-board-limit";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";
import { boardFactory } from "@/lib/testing/factories/board";
import { organizationSubscriptionFactory } from "@/lib/testing/factories/organization-subscription";

import { createBoard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $transaction: vi.fn(),
    board: { create: vi.fn() },
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

vi.mock("@/lib/create-audit-log", () => ({
  createAuditLog: vi.fn(),
}));

import { createAuditLog } from "@/lib/create-audit-log";

const authMock = vi.mocked(auth);
const transactionMock = vi.mocked(prisma.$transaction);
const boardCreateMock = vi.mocked(prisma.board.create);
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);
const createManyMock = vi.mocked(prisma.organizationLimit.createMany);
const defaultSubscriptionFindUniqueMock = vi.mocked(
  prisma.organizationSubscription.findUnique,
);
const txSubscriptionFindUniqueMock = vi.fn();
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const image = {
  id: "cXHsWI3gBws",
  thumbUrl:
    "https://images.unsplash.com/photo-1633933329875-044a32f4837f?w=200",
  fullUrl: "https://images.unsplash.com/photo-1633933329875-044a32f4837f?q=85",
  linkHTML: "https://unsplash.com/photos/cXHsWI3gBws",
  userName: "Svitlana",
};

const mockInteractiveTransaction = () => {
  transactionMock.mockImplementation(async (fn) => {
    if (typeof fn !== "function") {
      throw new Error("expected interactive $transaction");
    }

    return fn({
      board: { create: boardCreateMock },
      organizationLimit: {
        updateMany: updateManyMock,
        createMany: prisma.organizationLimit.createMany,
      },
      organizationSubscription: {
        findUnique: txSubscriptionFindUniqueMock,
      },
    } as never);
  });
};

describe("createBoard", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await createBoard({ title: "Roadmap", image });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txSubscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("creates a Free-plan board after reserving a slot in the same transaction", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValue(null);
    updateManyMock.mockResolvedValue({ count: 1 });
    boardCreateMock.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

    expect(defaultSubscriptionFindUniqueMock).not.toHaveBeenCalled();
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
      where: { orgId: "org_1", count: { lt: FREE_PLAN.maxBoards } },
      data: { count: { increment: 1 } },
    });
    expect(boardCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: board.title,
        orgId: "org_1",
        imageId: image.id,
        imageThumbUrl: image.thumbUrl,
        imageFullUrl: image.fullUrl,
        imageLinkHTML: image.linkHTML,
        imageUserName: image.userName,
      },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${board.id}`,
    );
    expect(result).toStrictEqual({ data: board });
  });

  test("increments the stored board counter for a Pro organization", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValue(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    createManyMock.mockResolvedValue({ count: 1 });
    updateManyMock.mockResolvedValue({ count: 1 });
    boardCreateMock.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

    expect(txSubscriptionFindUniqueMock).toHaveBeenCalledOnce();
    expect(createManyMock).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 0 },
      skipDuplicates: true,
    });
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: { increment: 1 } },
    });
    expect(boardCreateMock).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ data: board });
  });

  test("returns the Free-plan limit error without creating a board", async () => {
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValue(null);
    updateManyMock.mockResolvedValue({ count: 0 });
    vi.mocked(prisma.organizationLimit.createMany).mockResolvedValue({
      count: 0,
    });

    const result = await createBoard({ title: "Roadmap", image });

    expect(boardCreateMock).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
    });
  });

  test("returns Failed to create when the board insert throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValue(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    boardCreateMock.mockRejectedValue(new Error("db down"));

    const result = await createBoard({ title: "Roadmap", image });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });

  test("does not fail the board create when audit log throws", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValue(null);
    updateManyMock.mockResolvedValue({ count: 1 });
    createManyMock.mockResolvedValue({ count: 1 });
    boardCreateMock.mockResolvedValue(board);
    createAuditLogMock.mockRejectedValue(new Error("audit down"));

    const result = await createBoard({ title: board.title, image });

    // Still succeeded; client should not retry.
    expect(result).toStrictEqual({ data: board });
  });

  test("Free create fails after a Pro create pushes the counter over the cap", async () => {
    const firstBoard = boardFactory.build({
      orgId: "org_1",
      title: "Pro board",
    });
    const secondBoardTitle = "Free board";

    // 1) Pro create: should always increment counter (no cap enforcement).
    authMock.mockResolvedValue(orgAuth);
    txSubscriptionFindUniqueMock.mockResolvedValueOnce(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    createManyMock.mockResolvedValue({ count: 1 });
    updateManyMock.mockResolvedValue({ count: 1 });
    boardCreateMock.mockResolvedValue(firstBoard);

    const proResult = await createBoard({ title: firstBoard.title, image });
    expect(proResult).toStrictEqual({ data: firstBoard });

    // 2) Free create after downgrade: cap reached so action returns limit error.
    txSubscriptionFindUniqueMock.mockResolvedValueOnce(null);

    // incrementAvailableCount: updateMany (under cap) => 0
    // then createMany insert skipDuplicates => 0
    // then retry updateMany under cap => 0
    updateManyMock
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    createManyMock.mockResolvedValueOnce({ count: 0 });
    boardCreateMock.mockClear();

    const freeResult = await createBoard({ title: secondBoardTitle, image });

    expect(boardCreateMock).not.toHaveBeenCalled();
    expect(freeResult).toStrictEqual({
      serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
    });
  });
});
