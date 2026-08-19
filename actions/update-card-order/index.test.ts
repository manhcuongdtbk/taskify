import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { mockTxClient } from "@/lib/testing/prisma/mock-tx-client";
import { mockInteractiveTransaction } from "@/lib/testing/prisma/mock-interactive-transaction";
import { cardFactory } from "@/lib/testing/factories/card";
import { orgAuth } from "@/lib/testing/org-auth";
import { deferPromise } from "@/lib/testing/defer-promise";

import { updateCardOrder } from "./index";

vi.mock("@/lib/prisma/client");

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const authMock = vi.mocked(auth);
const txClient = mockTxClient();
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);

describe("updateCardOrder", () => {
  beforeEach(() => {
    mockInteractiveTransaction({ transactionMock, txClient });
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    authMock.mockResolvedValue({ orgId: null, userId: null } as Awaited<
      ReturnType<typeof auth>
    >);
    const card = cardFactory.build();

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(txClient.list.count).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Failed to reorder when a destination list is not on the org board", async () => {
    const staying = cardFactory.build({ listId: "list_1" });
    const moving = cardFactory.build({ listId: "list_other" });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.count.mockResolvedValue(1);

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [staying, moving],
    });

    expect(txClient.list.count).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: { in: [staying.listId, moving.listId] },
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(txClient.card.update).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });

  test("reorders cards whose current and destination lists are on the org board", async () => {
    const card = cardFactory.build({ listId: "list_1", order: 2 });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.count.mockResolvedValue(1);
    txClient.card.update.mockResolvedValue(card);

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(txClient.list.count).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: { in: [card.listId] },
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
    });
    expect(txClient.card.update).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: card.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { order: card.order, listId: card.listId },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: [card] });
  });

  test("waits for each card update before starting the next", async () => {
    const first = cardFactory.build({ listId: "list_1", order: 1 });
    const second = cardFactory.build({ listId: "list_1", order: 2 });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.count.mockResolvedValue(1);

    // Deferred promises let the test control *when* the Prisma
    // `$transaction` callback for each card resolves.
    //
    // This test specifically asserts that updates run sequentially:
    // we pause the first card update, verify the second hasn't started
    // yet, then resume the first update so the handler can proceed.
    //
    // `deferPromise(...)` wraps the “deferred promise” boilerplate
    // (promise + resolve/reject) so the test can control async timing
    // without the manual `let resolve!` / `new Promise(...)` pattern.
    const { promise: firstUpdateDidStart, resolve: signalFirstUpdateStarted } =
      deferPromise<void>();

    const { promise: firstUpdateResult, resolve: resolveFirstUpdate } =
      deferPromise<typeof first>();
    let secondStarted = false;

    txClient.card.update.mockImplementationOnce((_args) => {
      void _args;
      signalFirstUpdateStarted();
      return firstUpdateResult as ReturnType<typeof txClient.card.update>;
    });
    txClient.card.update.mockImplementationOnce((_args) => {
      void _args;
      secondStarted = true;
      return Promise.resolve(second) as ReturnType<typeof txClient.card.update>;
    });

    const resultPromise = updateCardOrder({
      boardId: "board_1",
      items: [first, second],
    });

    await firstUpdateDidStart;
    expect(txClient.card.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: first.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { order: first.order, listId: first.listId },
    });
    expect(secondStarted).toBe(false);

    resolveFirstUpdate(first);
    const result = await resultPromise;

    expect(txClient.card.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: second.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { order: second.order, listId: second.listId },
    });
    expect(result).toStrictEqual({ data: [first, second] });
  });

  test("skips the destination check and writes nothing when there are no items", async () => {
    authMock.mockResolvedValue(orgAuth);

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [],
    });

    expect(txClient.list.count).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: [] });
  });

  test("returns Failed to reorder when the destination count throws", async () => {
    const card = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    txClient.list.count.mockRejectedValue(new Error("db down"));

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });

  test("returns Failed to reorder when a card is not on the org board", async () => {
    const card = cardFactory.build({ listId: "list_1" });
    authMock.mockResolvedValue(orgAuth);
    txClient.list.count.mockResolvedValue(1);
    txClient.card.update.mockRejectedValue(
      new Error("Record to update not found"),
    );

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(txClient.card.update).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: card.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { order: card.order, listId: card.listId },
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });
});
