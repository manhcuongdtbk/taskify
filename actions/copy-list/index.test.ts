import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";
import { listWithCardsOrderedByOrderAscFactory } from "@/lib/testing/factories/list";

import { copyList } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    list: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
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
const listFindUniqueMock = vi.mocked(prisma.list.findUnique);
const listFindFirstMock = vi.mocked(prisma.list.findFirst);
const listCreateMock = vi.mocked(prisma.list.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

describe("copyList", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await copyList({ id: "list_1", boardId: "board_1" });

    expect(listFindUniqueMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns List not found when the list is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    listFindUniqueMock.mockResolvedValue(null);

    const result = await copyList({ id: "list_1", boardId: "board_1" });

    expect(listFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "list_1",
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
      include: { cards: true },
    });
    expect(listCreateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "List not found" });
  });

  test("copies a list that belongs to the org board", async () => {
    const card = cardFactory.build({
      title: "Ship P2",
      description: "Notes",
      order: 0,
    });
    const source = listWithCardsOrderedByOrderAscFactory.build(
      { title: "Todo", boardId: "board_1" },
      { associations: { cards: [card] } },
    );
    const copy = listWithCardsOrderedByOrderAscFactory.build({
      title: source.title,
      boardId: source.boardId,
      order: 1,
    });
    authMock.mockResolvedValue(orgAuth);
    listFindUniqueMock.mockResolvedValue(source);
    listFindFirstMock.mockResolvedValue(null);
    listCreateMock.mockResolvedValue(copy);

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expect(listFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: source.id,
        boardId: source.boardId,
        board: { orgId: "org_1" },
      },
      include: { cards: true },
    });
    expect(listFindFirstMock).toHaveBeenCalledExactlyOnceWith({
      where: { boardId: source.boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(listCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: source.title,
        boardId: source.boardId,
        order: 1,
        cards: {
          createMany: {
            data: [
              {
                title: card.title,
                description: card.description,
                order: card.order,
              },
            ],
          },
        },
      },
      include: { cards: true },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: copy.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: copy.title,
      action: ACTION.CREATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${source.boardId}`,
    );
    expect(result).toStrictEqual({ data: copy });
  });

  test("returns Failed to copy when the list insert throws", async () => {
    const source = listWithCardsOrderedByOrderAscFactory.build({
      boardId: "board_1",
    });
    authMock.mockResolvedValue(orgAuth);
    listFindUniqueMock.mockResolvedValue(source);
    listFindFirstMock.mockResolvedValue({ order: 2 } as never);
    listCreateMock.mockRejectedValue(new Error("db down"));

    const result = await copyList({ id: source.id, boardId: source.boardId });

    expect(listCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: source.title,
        boardId: source.boardId,
        order: 3,
        cards: {
          createMany: {
            data: [],
          },
        },
      },
      include: { cards: true },
    });
    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
