import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";
import { orgAuth } from "@/lib/testing/org-auth";

import { updateCard } from "./index";

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
const cardUpdateMock = vi.mocked(prisma.card.update);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

describe("updateCard", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await updateCard({
      id: "card_1",
      boardId: "board_1",
      title: "Renamed",
    });

    expect(cardUpdateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("updates a card that belongs to the org board", async () => {
    const card = cardFactory.build({ title: "Renamed" });
    authMock.mockResolvedValue(orgAuth);
    cardUpdateMock.mockResolvedValue(card);

    const result = await updateCard({
      id: card.id,
      boardId: "board_1",
      title: card.title,
    });

    expect(cardUpdateMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: card.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { title: card.title },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.UPDATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: card });
  });

  test("returns Failed to update when the card update throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    cardUpdateMock.mockRejectedValue(new Error("db down"));

    const result = await updateCard({
      id: "card_1",
      boardId: "board_1",
      title: "Renamed",
    });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to update." });
  });
});
