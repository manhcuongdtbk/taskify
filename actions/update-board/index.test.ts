import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma/client";
import { boardFactory } from "@/lib/testing/factories/board";
import { orgAuth } from "@/lib/testing/auth/org-auth";

import { updateBoard } from "./index";

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
const boardUpdateMock = vi.mocked(prisma.board.update);
const revalidatePathMock = vi.mocked(revalidatePath);
const createAuditLogMock = vi.mocked(createAuditLog);

describe("updateBoard", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const result = await updateBoard({ id: "board_1", title: "Roadmap" });

    expect(boardUpdateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("updates a board that belongs to the org", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
    boardUpdateMock.mockRejectedValue(new Error("db down"));

    const result = await updateBoard({ id: "board_1", title: "Roadmap" });

    expect(createAuditLogMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to update." });
  });
});
