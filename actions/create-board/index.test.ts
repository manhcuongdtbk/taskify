import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { FREE_BOARD_LIMIT_SERVER_ERROR } from "@/lib/errors/free-board-limit";
import prisma from "@/lib/prisma/client";
import { checkSubscription } from "@/lib/subscription";
import { FREE_PLAN } from "@/constants/pricing-plans";
import { boardFactory } from "@/lib/testing/factories/board";

import { createBoard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $transaction: vi.fn(),
    board: { create: vi.fn() },
    organizationLimit: {
      updateMany: vi.fn(),
      create: vi.fn(),
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

vi.mock("@/lib/subscription", () => ({
  checkSubscription: vi.fn(),
}));

import { createAuditLog } from "@/lib/create-audit-log";

const authMock = vi.mocked(auth);
const checkSubscriptionMock = vi.mocked(checkSubscription);
const transactionMock = vi.mocked(prisma.$transaction);
const boardCreateMock = vi.mocked(prisma.board.create);
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);
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
        create: prisma.organizationLimit.create,
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
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("creates a Free-plan board after reserving a slot in the same transaction", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    checkSubscriptionMock.mockResolvedValue(false);
    updateManyMock.mockResolvedValue({ count: 1 });
    boardCreateMock.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

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

  test("skips the Free-plan slot reserve for a Pro organization", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    checkSubscriptionMock.mockResolvedValue(true);
    boardCreateMock.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(boardCreateMock).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ data: board });
  });

  test("returns the Free-plan limit error without creating a board", async () => {
    authMock.mockResolvedValue(orgAuth);
    checkSubscriptionMock.mockResolvedValue(false);
    updateManyMock.mockResolvedValue({ count: 0 });
    vi.mocked(prisma.organizationLimit.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0",
      }),
    );

    const result = await createBoard({ title: "Roadmap", image });

    expect(boardCreateMock).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
    });
  });

  test("returns Failed to create when the board insert throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    checkSubscriptionMock.mockResolvedValue(true);
    boardCreateMock.mockRejectedValue(new Error("db down"));

    const result = await createBoard({ title: "Roadmap", image });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });
});
