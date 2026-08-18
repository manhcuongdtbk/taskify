import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { boardFactory } from "@/lib/testing/factories/board";

import { updateBoard } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: { board: { update: vi.fn() } },
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
const boardUpdateMock = vi.mocked(prisma.board.update);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

describe("updateBoard", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await updateBoard({ id: "board_1", title: "Roadmap" });

    expect(boardUpdateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("updates a board that belongs to the org", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    boardUpdateMock.mockResolvedValue(board);

    const result = await updateBoard({ id: board.id, title: board.title });

    expect(boardUpdateMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
      data: { title: board.title },
    });
    expect(createAuditLogMock).toHaveBeenCalledExactlyOnceWith({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.UPDATE,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${board.id}`,
    );
    expect(result).toStrictEqual({ data: board });
  });

  test("returns Failed to update when the board update throws", async () => {
    authMock.mockResolvedValue(orgAuth);
    boardUpdateMock.mockRejectedValue(new Error("db down"));

    const result = await updateBoard({ id: "board_1", title: "Roadmap" });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to update." });
  });
});
