import { describe, expect, test, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";

import { type Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { organizationLimitFactory } from "@/lib/testing/factories/organization-limit";

import {
  getAvailableCount,
  withOrganizationLimitLock,
} from "./organization-limit";

vi.mock("@/lib/prisma/client");

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

const lockedOrgLimitRow = [{}];

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
};

describe("withOrganizationLimitLock", () => {
  test("does not accept the global Prisma Client in place of tx", () => {
    type Writer = Parameters<typeof withOrganizationLimitLock>[1];
    const txIsWriter: Prisma.TransactionClient extends Writer ? true : never =
      true;
    const prismaClientIsNotWriter: PrismaClient extends Writer ? never : true =
      true;

    expect(txIsWriter).toBe(true);
    expect(prismaClientIsNotWriter).toBe(true);
  });

  test("throws without writing when orgId is empty", async () => {
    const mutate = vi.fn();

    await expect(
      withOrganizationLimitLock("", tx, async () => {
        mutate();
        return "ok";
      }),
    ).rejects.toThrow("Unauthorized");

    expect(mutate).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(boardCountMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("throws when FOR UPDATE matches no row", async () => {
    createManyMock.mockResolvedValue({ count: 0 });
    queryRawMock.mockResolvedValue([]);

    const mutate = vi.fn(async () => "ok");

    await expect(
      withOrganizationLimitLock("org_1", tx, mutate),
    ).rejects.toThrow("Organization limit row not found");

    expect(mutate).not.toHaveBeenCalled();
    expect(boardCountMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  test("locks the limit row, runs mutate, then syncs stored counter", async () => {
    createManyMock.mockResolvedValue({ count: 1 });
    queryRawMock.mockResolvedValue(lockedOrgLimitRow);
    boardCountMock.mockResolvedValue(4);
    updateManyMock.mockResolvedValue({ count: 1 });

    const mutate = vi.fn(async () => "ok" as const);

    const result = await withOrganizationLimitLock("org_1", tx, mutate);

    expect(authMock).not.toHaveBeenCalled();
    expectLockedOrgRow();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(boardCountMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 4 },
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(result).toBe("ok");
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
