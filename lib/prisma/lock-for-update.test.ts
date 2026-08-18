import { describe, expect, test, vi } from "vitest";

import { type Prisma, type PrismaClient } from "@/app/generated/prisma/client";

import { lockBoardRowForUpdate, lockListRowForUpdate } from "./lock-for-update";

const queryRawMock = vi.fn();
const tx = { $queryRaw: queryRawMock };

const expectLockedRow = (table: "Board" | "List", id: string) => {
  expect(queryRawMock).toHaveBeenCalledOnce();
  const [query, ...values] = queryRawMock.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain(`FROM "${table}"`);
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([id]);
};

describe("lockBoardRowForUpdate", () => {
  test("does not accept the global Prisma Client in place of tx", () => {
    type Writer = Parameters<typeof lockBoardRowForUpdate>[1];
    const txIsWriter: Prisma.TransactionClient extends Writer ? true : never =
      true;
    const prismaClientIsNotWriter: PrismaClient extends Writer ? never : true =
      true;

    expect(txIsWriter).toBe(true);
    expect(prismaClientIsNotWriter).toBe(true);
  });

  test("returns true when the board row is locked", async () => {
    queryRawMock.mockResolvedValue([{}]);

    const locked = await lockBoardRowForUpdate("board_1", tx);

    expectLockedRow("Board", "board_1");
    expect(locked).toBe(true);
  });

  test("returns false when the board row is gone", async () => {
    queryRawMock.mockResolvedValue([]);

    const locked = await lockBoardRowForUpdate("board_1", tx);

    expectLockedRow("Board", "board_1");
    expect(locked).toBe(false);
  });
});

describe("lockListRowForUpdate", () => {
  test("does not accept the global Prisma Client in place of tx", () => {
    type Writer = Parameters<typeof lockListRowForUpdate>[1];
    const txIsWriter: Prisma.TransactionClient extends Writer ? true : never =
      true;
    const prismaClientIsNotWriter: PrismaClient extends Writer ? never : true =
      true;

    expect(txIsWriter).toBe(true);
    expect(prismaClientIsNotWriter).toBe(true);
  });

  test("returns true when the list row is locked", async () => {
    queryRawMock.mockResolvedValue([{}]);

    const locked = await lockListRowForUpdate("list_1", tx);

    expectLockedRow("List", "list_1");
    expect(locked).toBe(true);
  });

  test("returns false when the list row is gone", async () => {
    queryRawMock.mockResolvedValue([]);

    const locked = await lockListRowForUpdate("list_1", tx);

    expectLockedRow("List", "list_1");
    expect(locked).toBe(false);
  });
});
