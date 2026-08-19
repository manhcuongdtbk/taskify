import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { orgAuth } from "@/lib/testing/org-auth";
import { listFactory } from "@/lib/testing/factories/list";

import { updateListOrder } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const getOrgAuthMock = vi.mocked(getOrgAuth);
const listUpdateMock = vi.mocked(prisma.list.update);
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);

describe("updateListOrder", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);
    const list = listFactory.build();

    const result = await updateListOrder({
      boardId: "board_1",
      items: [list],
    });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("reorders lists that belong to the org board", async () => {
    const list = listFactory.build({ boardId: "board_1", order: 2 });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    listUpdateMock.mockResolvedValue(list);
    transactionMock.mockResolvedValue([list]);

    const result = await updateListOrder({
      boardId: list.boardId,
      items: [list],
    });

    expect(listUpdateMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: list.id,
        boardId: list.boardId,
        board: { orgId: "org_1" },
      },
      data: { order: list.order },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      `/board/${list.boardId}`,
    );
    expect(result).toStrictEqual({ data: [list] });
  });

  test("returns Failed to reorder when the list update throws", async () => {
    const list = listFactory.build({ boardId: "board_1" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    transactionMock.mockRejectedValue(new Error("db down"));

    const result = await updateListOrder({
      boardId: list.boardId,
      items: [list],
    });

    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });
});
