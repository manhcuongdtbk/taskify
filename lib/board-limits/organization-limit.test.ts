import { describe, expect, test, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";

import { FREE_PLAN } from "@/constants/pricing-plans";
import { type Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { organizationLimitFactory } from "@/lib/testing/factories/organization-limit";

import {
  decrementAvailableCount,
  getAvailableCount,
  incrementAvailableCount,
  incrementBoardCount,
} from "./organization-limit";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    $queryRaw: vi.fn(),
    board: { count: vi.fn() },
    organizationLimit: {
      findUnique: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const authMock = vi.mocked(auth);
const findUniqueMock = vi.mocked(prisma.organizationLimit.findUnique);
const createManyMock = vi.mocked(prisma.organizationLimit.createMany);
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);
const queryRawMock = vi.mocked(prisma.$queryRaw);
const boardCountMock = vi.mocked(prisma.board.count);

const orgAuth = { orgId: "org_1" } as Awaited<ReturnType<typeof auth>>;

const tx = {
  $queryRaw: queryRawMock,
  board: { count: boardCountMock },
  organizationLimit: {
    createMany: createManyMock,
    updateMany: updateManyMock,
  },
};

const expectLockedOrgRow = () => {
  expect(createManyMock).toHaveBeenCalledExactlyOnceWith({
    data: { orgId: "org_1", count: 0 },
    skipDuplicates: true,
  });
  expect(queryRawMock).toHaveBeenCalledOnce();
  const [query, ...values] = queryRawMock.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual(["org_1"]);
  expect(boardCountMock).toHaveBeenCalledExactlyOnceWith({
    where: { orgId: "org_1" },
  });
};

describe("incrementAvailableCount", () => {
  test("does not accept the global Prisma Client in place of tx", () => {
    type Writer = Parameters<typeof incrementAvailableCount>[1];
    const txIsWriter: Prisma.TransactionClient extends Writer ? true : never =
      true;
    const prismaClientIsNotWriter: PrismaClient extends Writer ? never : true =
      true;

    expect(txIsWriter).toBe(true);
    expect(prismaClientIsNotWriter).toBe(true);
  });

  test("throws without writing when orgId is empty", async () => {
    await expect(incrementAvailableCount("", tx)).rejects.toThrow(
      "Unauthorized",
    );
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(boardCountMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("reserves a slot from the live board count when under the Free plan cap", async () => {
    createManyMock.mockResolvedValue({ count: 1 });
    queryRawMock.mockResolvedValue([]);
    boardCountMock.mockResolvedValue(2);
    updateManyMock.mockResolvedValue({ count: 1 });

    const reserved = await incrementAvailableCount("org_1", tx);

    expect(authMock).not.toHaveBeenCalled();
    expectLockedOrgRow();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 3 },
    });
    expect(reserved).toBe(true);
  });

  test("refuses a Free slot when live boards are at the cap even if the stored count is stale", async () => {
    createManyMock.mockResolvedValue({ count: 0 });
    queryRawMock.mockResolvedValue([]);
    boardCountMock.mockResolvedValue(FREE_PLAN.maxBoards);
    updateManyMock.mockResolvedValue({ count: 1 });

    const reserved = await incrementAvailableCount("org_1", tx);

    expectLockedOrgRow();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: FREE_PLAN.maxBoards },
    });
    expect(updateManyMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { count: { increment: 1 } },
      }),
    );
    expect(reserved).toBe(false);
  });

  test("rethrows unexpected insert errors", async () => {
    createManyMock.mockRejectedValue(new Error("db down"));

    await expect(incrementAvailableCount("org_1", tx)).rejects.toThrow(
      "db down",
    );
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(boardCountMock).not.toHaveBeenCalled();
  });
});

describe("decrementAvailableCount", () => {
  test("throws without writing when orgId is empty", async () => {
    await expect(decrementAvailableCount("", tx)).rejects.toThrow(
      "Unauthorized",
    );
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("writes the remaining live board count after a delete", async () => {
    createManyMock.mockResolvedValue({ count: 0 });
    queryRawMock.mockResolvedValue([]);
    boardCountMock.mockResolvedValue(4);
    updateManyMock.mockResolvedValue({ count: 1 });

    await decrementAvailableCount("org_1", tx);

    expect(authMock).not.toHaveBeenCalled();
    expectLockedOrgRow();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 4 },
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("incrementBoardCount", () => {
  test("throws without writing when orgId is empty", async () => {
    await expect(incrementBoardCount("", tx)).rejects.toThrow("Unauthorized");
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("writes live board count plus one for a Pro create", async () => {
    createManyMock.mockResolvedValue({ count: 1 });
    queryRawMock.mockResolvedValue([]);
    boardCountMock.mockResolvedValue(10);
    updateManyMock.mockResolvedValue({ count: 1 });

    await incrementBoardCount("org_1", tx);

    expectLockedOrgRow();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 11 },
    });
  });
});

describe("getAvailableCount", () => {
  test("returns 0 without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await getAvailableCount();

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  test("returns 0 when the organization has no limit row", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    const result = await getAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(result).toBe(0);
  });

  test("returns the stored board count", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(
      organizationLimitFactory.build({ orgId: "org_1", count: 3 }),
    );

    const result = await getAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(result).toBe(3);
  });
});
