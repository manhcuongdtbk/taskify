import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { cardFactory } from "@/lib/testing/factories/card";

import { updateCardOrder } from "./index";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    list: { count: vi.fn() },
    card: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const authMock = vi.mocked(auth);
const listCountMock = vi.fn();
const cardUpdateMock = vi.fn();
const transactionMock = vi.mocked(prisma.$transaction);
const revalidatePathMock = vi.mocked(revalidatePath);

const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;

describe("updateCardOrder", () => {
  const mockInteractiveTransaction = () => {
    transactionMock.mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction");
      }

      return fn({
        list: { count: listCountMock },
        card: { update: cardUpdateMock },
      } as never);
    });
  };

  beforeEach(() => {
    mockInteractiveTransaction();
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

    expect(listCountMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Failed to reorder when a destination list is not on the org board", async () => {
    const staying = cardFactory.build({ listId: "list_1" });
    const moving = cardFactory.build({ listId: "list_other" });
    authMock.mockResolvedValue(orgAuth);
    listCountMock.mockResolvedValue(1);

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [staying, moving],
    });

    expect(listCountMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: { in: [staying.listId, moving.listId] },
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(cardUpdateMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Failed to reorder." });
  });

  test("reorders cards whose current and destination lists are on the org board", async () => {
    const card = cardFactory.build({ listId: "list_1", order: 2 });
    authMock.mockResolvedValue(orgAuth);
    listCountMock.mockResolvedValue(1);
    cardUpdateMock.mockResolvedValue(card);

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(listCountMock).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: { in: [card.listId] },
        boardId: "board_1",
        board: { orgId: "org_1" },
      },
    });
    expect(cardUpdateMock).toHaveBeenCalledExactlyOnceWith({
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
    listCountMock.mockResolvedValue(1);

    let firstUpdateStarted!: () => void;
    const firstUpdateHasStarted = new Promise<void>((resolve) => {
      firstUpdateStarted = resolve;
    });
    let resumeFirst!: (card: typeof first) => void;
    const firstUpdate = new Promise<typeof first>((resolve) => {
      resumeFirst = resolve;
    });
    let secondStarted = false;

    cardUpdateMock.mockImplementationOnce(() => {
      firstUpdateStarted();
      return firstUpdate;
    });
    cardUpdateMock.mockImplementationOnce(() => {
      secondStarted = true;
      return Promise.resolve(second);
    });

    const resultPromise = updateCardOrder({
      boardId: "board_1",
      items: [first, second],
    });

    await firstUpdateHasStarted;
    expect(cardUpdateMock).toHaveBeenNthCalledWith(1, {
      where: {
        id: first.id,
        list: { boardId: "board_1", board: { orgId: "org_1" } },
      },
      data: { order: first.order, listId: first.listId },
    });
    expect(secondStarted).toBe(false);

    resumeFirst(first);
    const result = await resultPromise;

    expect(cardUpdateMock).toHaveBeenNthCalledWith(2, {
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

    expect(listCountMock).not.toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/board/board_1",
    );
    expect(result).toStrictEqual({ data: [] });
  });

  test("returns Failed to reorder when the destination count throws", async () => {
    const card = cardFactory.build();
    authMock.mockResolvedValue(orgAuth);
    listCountMock.mockRejectedValue(new Error("db down"));

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
    listCountMock.mockResolvedValue(1);
    cardUpdateMock.mockRejectedValue(new Error("Record to update not found"));

    const result = await updateCardOrder({
      boardId: "board_1",
      items: [card],
    });

    expect(cardUpdateMock).toHaveBeenCalledExactlyOnceWith({
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
