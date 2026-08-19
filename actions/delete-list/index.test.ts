import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { listFactory } from "@/lib/testing/factories/list";
import { orgAuth } from "@/lib/testing/org-auth";

import { deleteList } from "./index";

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
const listDeleteMock = vi.mocked(prisma.list.delete);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

describe("deleteList", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await deleteList({ id: "list_1", boardId: "board_1" });

    expect(listDeleteMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("deletes a list that belongs to the active org board", async () => {
    const list = listFactory.build({ boardId: "board_1" });
    authMock.mockResolvedValue(orgAuth);
    listDeleteMock.mockResolvedValue(list);

    const result = await deleteList({ id: list.id, boardId: list.boardId });

    expect(listDeleteMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: list.id, boardId: list.boardId, board: { orgId: "org_1" } },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.DELETE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${list.boardId}`,
    );
    expect(result).toStrictEqual({ data: list });
  });

  test("returns Failed to delete when the list delete throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    listDeleteMock.mockRejectedValue(new Error("db down"));

    const result = await deleteList({ id: "list_1", boardId: "board_1" });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to delete." });
  });
});
