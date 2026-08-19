import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import { mockInteractiveTransaction } from "@/lib/testing/prisma/mock-interactive-transaction";
import { orgAuth } from "@/lib/testing/org-auth";
import { FREE_BOARD_LIMIT_SERVER_ERROR } from "@/lib/board-limits/free-board-limit";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";
import { boardFactory } from "@/lib/testing/factories/board";
import { organizationSubscriptionFactory } from "@/lib/testing/factories/organization-subscription";

import { createBoard } from "./index";

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
const defaultSubscriptionFindUniqueMock = vi.mocked(
  prisma.organizationSubscription.findUnique,
);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const lockedOrgLimitRow = [{}];

const image = {
  id: "cXHsWI3gBws",
  thumbUrl:
    "https://images.unsplash.com/photo-1633933329875-044a32f4837f?w=200",
  fullUrl: "https://images.unsplash.com/photo-1633933329875-044a32f4837f?q=85",
  linkHTML: "https://unsplash.com/photos/cXHsWI3gBws",
  userName: "Svitlana",
};

describe("createBoard", () => {
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

    const result = await createBoard({ title: "Roadmap", image });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.organizationSubscription.findUnique).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("creates a Free-plan board after reserving a slot in the same transaction", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationSubscription.findUnique.mockResolvedValue(null);
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 1 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    // Cap-check COUNT, then sync COUNT after the insert.
    txClient.board.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });
    txClient.board.create.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

    expect(defaultSubscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(
      txClient.organizationSubscription.findUnique,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    });
    expect(txClient.board.count).toHaveBeenCalledTimes(2);
    expect(txClient.board.count).toHaveBeenNthCalledWith(1, {
      where: { orgId: "org_1" },
    });
    expect(txClient.board.count).toHaveBeenNthCalledWith(2, {
      where: { orgId: "org_1" },
    });
    expect(
      txClient.organizationLimit.updateMany,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 3 },
    });
    expect(txClient.board.create).toHaveBeenCalledExactlyOnceWith({
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationSubscription.findUnique.mockResolvedValue(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 1 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    // Sync COUNT after the insert.
    txClient.board.count.mockResolvedValue(11);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });
    txClient.board.create.mockResolvedValue(board);

    const result = await createBoard({ title: board.title, image });

    expect(txClient.organizationSubscription.findUnique).toHaveBeenCalledOnce();
    expect(
      txClient.organizationLimit.createMany,
    ).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 0 },
      skipDuplicates: true,
    });
    expect(
      txClient.organizationLimit.updateMany,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 11 },
    });
    expect(txClient.board.create).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ data: board });
  });

  test("returns the Free-plan limit error without creating a board and keeps the healed stored count", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationSubscription.findUnique.mockResolvedValue(null);
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 0 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    // Cap-check COUNT, then sync COUNT (unchanged because we don't insert).
    txClient.board.count
      .mockResolvedValueOnce(FREE_PLAN.maxBoards)
      .mockResolvedValueOnce(FREE_PLAN.maxBoards);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });

    const result = await createBoard({ title: "Roadmap", image });

    expect(
      txClient.organizationLimit.updateMany,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: FREE_PLAN.maxBoards },
    });
    expect(txClient.board.create).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({
      serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
    });
  });

  test("returns Failed to create when the board insert throws", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationSubscription.findUnique.mockResolvedValue(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 1 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    txClient.board.count.mockResolvedValue(0);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });
    txClient.board.create.mockRejectedValue(new Error("db down"));

    const result = await createBoard({ title: "Roadmap", image });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to create." });
  });

  test("Free create fails when live boards are already at the cap", async () => {
    const firstBoard = boardFactory.build({
      orgId: "org_1",
      title: "Pro board",
    });
    const secondBoardTitle = "Free board";

    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.organizationSubscription.findUnique.mockResolvedValueOnce(
      organizationSubscriptionFactory.build({ orgId: "org_1" }),
    );
    txClient.organizationLimit.createMany.mockResolvedValue({ count: 1 });
    txClient.$queryRaw.mockResolvedValue(lockedOrgLimitRow);
    txClient.board.count.mockResolvedValueOnce(4);
    txClient.organizationLimit.updateMany.mockResolvedValue({ count: 1 });
    txClient.board.create.mockResolvedValue(firstBoard);

    const proResult = await createBoard({ title: firstBoard.title, image });
    expect(proResult).toStrictEqual({ data: firstBoard });

    txClient.organizationSubscription.findUnique.mockResolvedValueOnce(null);
    // Cap-check COUNT, then sync COUNT.
    txClient.board.count
      .mockResolvedValueOnce(FREE_PLAN.maxBoards)
      .mockResolvedValueOnce(FREE_PLAN.maxBoards);
    txClient.board.create.mockClear();

    const freeResult = await createBoard({ title: secondBoardTitle, image });

    expect(txClient.board.create).not.toHaveBeenCalled();
    expect(freeResult).toStrictEqual({
      serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
    });
  });
});
