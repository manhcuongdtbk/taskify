import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { orgAuth } from "@/lib/testing/org-auth";
import { listFactory } from "@/lib/testing/factories/list";

import { updateList } from "./index";

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
const listUpdateMock = vi.mocked(prisma.list.update);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

describe("updateList", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await updateList({
      id: "list_1",
      boardId: "board_1",
      title: "Doing",
    });

    expect(listUpdateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("updates a list that belongs to the org board", async () => {
    const list = listFactory.build({ boardId: "board_1", title: "Doing" });
    authMock.mockResolvedValue(orgAuth);
    listUpdateMock.mockResolvedValue(list);

    const result = await updateList({
      id: list.id,
      boardId: list.boardId,
      title: list.title,
    });

    expect(listUpdateMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: list.id,
        boardId: list.boardId,
        board: { orgId: "org_1" },
      },
      data: { title: list.title },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.UPDATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${list.boardId}`,
    );
    expect(result).toStrictEqual({ data: list });
  });

  test("returns Failed to update when the list update throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    listUpdateMock.mockRejectedValue(new Error("db down"));

    const result = await updateList({
      id: "list_1",
      boardId: "board_1",
      title: "Doing",
    });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to update." });
  });
});
