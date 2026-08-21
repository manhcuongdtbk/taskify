import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";
import { orgAuth } from "@/lib/testing/auth/org-auth";

import { deleteCard } from "./index";

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
const cardDeleteMock = vi.mocked(prisma.card.delete);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

describe("deleteCard", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const result = await deleteCard({ id: "card_1", boardId: "board_1" });

    expect(cardDeleteMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("deletes a card that belongs to the org board", async () => {
    const card = cardFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    cardDeleteMock.mockResolvedValue(card);

    const result = await deleteCard({ id: card.id, boardId: "board_1" });

    expect(cardDeleteMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: card.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.DELETE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: card });
  });

  test("returns Failed to delete when the card delete throws", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    cardDeleteMock.mockRejectedValue(new Error("db down"));

    const result = await deleteCard({ id: "card_1", boardId: "board_1" });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });
});
