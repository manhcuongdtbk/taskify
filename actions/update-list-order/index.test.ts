import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { listFactory } from "@/lib/testing/factories/list";

import { updateListOrder } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const authMock = vi.mocked(auth);
const listUpdateMock = vi.mocked(prisma.list.update);
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

describe("updateListOrder", () => {
  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);
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
    authMock.mockResolvedValue(orgAuth);
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
    authMock.mockResolvedValue(orgAuth);
    transactionMock.mockRejectedValue(new Error("db down"));

    const result = await updateListOrder({
      boardId: list.boardId,
      items: [list],
    });

    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });
});
