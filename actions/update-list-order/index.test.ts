import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import { mockInteractiveTransaction } from "@/lib/testing/prisma/mock-interactive-transaction";
import { listFactory } from "@/lib/testing/factories/list";
import { orgAuth } from "@/lib/testing/org-auth";
import { deferPromise } from "@/lib/testing/defer-promise";

import { updateListOrder } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const getOrgAuthMock = vi.mocked(getOrgAuth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);

describe("updateListOrder", () => {
  beforeEach(() => {
    mockInteractiveTransaction({ transactionMock, txClient });
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);
    const list = listFactory.build();

    const result = await updateListOrder({
      boardId: "board_1",
      items: [list],
    });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(txClient.list.update).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("reorders lists that belong to the org board", async () => {
    const list = listFactory.build({ order: 2 });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.list.update.mockResolvedValue(list);

    const result = await updateListOrder({
      boardId: "board_1",
      items: [list],
    });

    expect(txClient.list.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: list.id, boardId: "board_1", board: { orgId: "org_1" } },
      data: { order: list.order },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: [list] });
  });

  test("waits for each list update before starting the next", async () => {
    const first = listFactory.build({ order: 1 });
    const second = listFactory.build({ order: 2 });
    getOrgAuthMock.mockResolvedValue(orgAuth);

    const { promise: firstUpdateDidStart, resolve: signalFirstUpdateStarted } =
      deferPromise<void>();

    const { promise: firstUpdateResult, resolve: resolveFirstUpdate } =
      deferPromise<typeof first>();
    let secondStarted = false;

    txClient.list.update.mockImplementationOnce((_args) => {
      void _args;
      signalFirstUpdateStarted();
      return firstUpdateResult as ReturnType<typeof txClient.list.update>;
    });
    txClient.list.update.mockImplementationOnce((_args) => {
      void _args;
      secondStarted = true;
      return Promise.resolve(second) as ReturnType<typeof txClient.list.update>;
    });

    const resultPromise = updateListOrder({
      boardId: "board_1",
      items: [first, second],
    });

    await firstUpdateDidStart;
    expect(txClient.list.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: first.id,
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
      data: { order: first.order },
    });
    expect(secondStarted).toBe(false);

    resolveFirstUpdate(first);
    const result = await resultPromise;

    expect(txClient.list.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: second.id,
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
      data: { order: second.order },
    });
    expect(result).toStrictEqual({ data: [first, second] });
  });

  test("returns Failed to reorder when a list is not on the org board", async () => {
    const list = listFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    txClient.list.update.mockRejectedValue(
      new Error("Record to update not found"),
    );

    const result = await updateListOrder({
      boardId: "board_1",
      items: [list],
    });

    expect(txClient.list.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: list.id, boardId: "board_1", board: { orgId: "org_1" } },
      data: { order: list.order },
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });

  test("writes nothing and revalidates when there are no items", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);

    const result = await updateListOrder({
      boardId: "board_1",
      items: [],
    });

    expect(txClient.list.update).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: [] });
  });
});
