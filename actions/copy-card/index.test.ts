import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";

import { copyCard } from "./index";

vi.mock("@/lib/prisma/client");

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
const globalCardFindUniqueMock = vi.mocked(prisma.card.findUnique);
const globalCardFindFirstMock = vi.mocked(prisma.card.findFirst);
const globalCardCreateMock = vi.mocked(prisma.card.create);
const txQueryRawMock = vi.fn();
const txCardFindUniqueMock = vi.fn();
const txCardFindFirstMock = vi.fn();
const txCardCreateMock = vi.fn();
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

let lastTransactionOutcome: "committed" | "rolledBack" | undefined;

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

const expectLockedList = (listId: string) => {
  expect(txQueryRawMock).toHaveBeenCalledOnce();
  const [query, ...values] = txQueryRawMock.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain('FROM "List"');
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([listId]);
};

const expectGlobalClientUnused = () => {
  expect(globalQueryRawMock).not.toHaveBeenCalled();
  expect(globalCardFindUniqueMock).not.toHaveBeenCalled();
  expect(globalCardFindFirstMock).not.toHaveBeenCalled();
  expect(globalCardCreateMock).not.toHaveBeenCalled();
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
        card: {
          findUnique: txCardFindUniqueMock,
          findFirst: txCardFindFirstMock,
          create: txCardCreateMock,
        },
      } as never);
      lastTransactionOutcome = "committed";
      return value;
    } catch (reason) {
      lastTransactionOutcome = "rolledBack";
      throw reason;
    }
  });
};

describe("copyCard", () => {
  beforeEach(() => {
    mockInteractiveTransaction();
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txCardFindUniqueMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Card not found when the card is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    txCardFindUniqueMock.mockResolvedValue(null);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(txCardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "card_1",
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expect(txQueryRawMock).not.toHaveBeenCalled();
    expect(txCardCreateMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Card not found" });
  });

  test("returns Card not found when the list row lock misses", async () => {
    const source = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    txCardFindUniqueMock.mockResolvedValue(source);
    txQueryRawMock.mockResolvedValue([]);

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expectLockedList(source.listId);
    expect(txCardCreateMock).not.toHaveBeenCalled();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(result).toStrictEqual({ serverError: "Card not found" });
  });

  test("copies a card that belongs to the org board", async () => {
    const source = cardFactory.build({
      title: "Ship P2",
      description: "Notes",
    });
    const copy = cardFactory.build({
      title: "Ship P2 (Copy)",
      listId: source.listId,
    });
    authMock.mockResolvedValue(orgAuth);
    txCardFindUniqueMock.mockResolvedValue(source);
    txQueryRawMock.mockResolvedValue([{}]);
    txCardFindFirstMock.mockResolvedValue(null);
    txCardCreateMock.mockResolvedValue(copy);

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expect(txCardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: source.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expectLockedList(source.listId);
    expect(txCardFindFirstMock).toHaveBeenCalledExactlyOnceWith({
      where: { listId: source.listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(txCardCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: "Ship P2 (Copy)",
        description: source.description,
        order: 1,
        listId: source.listId,
      },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("committed");
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: copy.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: copy.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: copy });
  });

  test("returns Failed to copy when the card insert throws", async () => {
    const source = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    txCardFindUniqueMock.mockResolvedValue(source);
    txQueryRawMock.mockResolvedValue([{}]);
    txCardFindFirstMock.mockResolvedValue({ order: 2 } as never);
    txCardCreateMock.mockRejectedValue(new Error("db down"));

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expectGlobalClientUnused();
    expect(lastTransactionOutcome).toBe("rolledBack");
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
