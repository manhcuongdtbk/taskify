import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";

import { copyCard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    card: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
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
const cardFindUniqueMock = vi.mocked(prisma.card.findUnique);
const cardFindFirstMock = vi.mocked(prisma.card.findFirst);
const cardCreateMock = vi.mocked(prisma.card.create);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

describe("copyCard", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(cardFindUniqueMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Card not found when the card is not on the org board", async () => {
    authMock.mockResolvedValue(orgAuth);
    cardFindUniqueMock.mockResolvedValue(null);

    const result = await copyCard({ id: "card_1", boardId: "board_1" });

    expect(cardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "card_1",
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expect(cardCreateMock).not.toHaveBeenCalled();
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
    cardFindUniqueMock.mockResolvedValue(source);
    cardFindFirstMock.mockResolvedValue(null);
    cardCreateMock.mockResolvedValue(copy);

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expect(cardFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: source.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expect(cardCreateMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        title: "Ship P2 (Copy)",
        description: source.description,
        order: 1,
        listId: source.listId,
      },
    });
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
    cardFindUniqueMock.mockResolvedValue(source);
    cardFindFirstMock.mockResolvedValue({ order: 2 } as never);
    cardCreateMock.mockRejectedValue(new Error("db down"));

    const result = await copyCard({ id: source.id, boardId: "board_1" });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to copy." });
  });
});
