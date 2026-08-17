import { describe, expect, test, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";

import { FREE_PLAN } from "@/constants/pricing-plans";
import prisma from "@/lib/prisma/client";
import { organizationLimitFactory } from "@/lib/testing/factories/organization-limit";

import {
  decrementAvailableCount,
  getAvailableCount,
  incrementAvailableCount,
} from "./organization-limit";

vi.mock("@/lib/prisma/client", () => ({
  default: {
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

const orgAuth = { orgId: "org_1" } as Awaited<ReturnType<typeof auth>>;

describe("incrementAvailableCount", () => {
  test("throws without writing when orgId is empty", async () => {
    await expect(incrementAvailableCount("")).rejects.toThrow("Unauthorized");
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("increments when the stored count is below the Free plan cap", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    const reserved = await incrementAvailableCount("org_1");

    expect(authMock).not.toHaveBeenCalled();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { lt: FREE_PLAN.maxBoards } },
      data: { count: { increment: 1 } },
    });
    expect(createManyMock).not.toHaveBeenCalled();
    expect(reserved).toBe(true);
  });

  test("creates a count of 1 when there is no limit row", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    createManyMock.mockResolvedValue({ count: 1 });

    const reserved = await incrementAvailableCount("org_1");

    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { lt: FREE_PLAN.maxBoards } },
      data: { count: { increment: 1 } },
    });
    expect(createManyMock).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 1 },
      skipDuplicates: true,
    });
    expect(reserved).toBe(true);
  });

  test("retries the cap increment when a concurrent insert wins the row", async () => {
    updateManyMock
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    createManyMock.mockResolvedValue({ count: 0 });

    const reserved = await incrementAvailableCount("org_1");

    expect(createManyMock).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 1 },
      skipDuplicates: true,
    });
    expect(updateManyMock).toHaveBeenCalledTimes(2);
    expect(reserved).toBe(true);
  });

  test("returns false when the Free plan cap is already reached", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    createManyMock.mockResolvedValue({ count: 0 });

    const reserved = await incrementAvailableCount("org_1");

    expect(updateManyMock).toHaveBeenCalledTimes(2);
    expect(createManyMock).toHaveBeenCalledOnce();
    expect(reserved).toBe(false);
  });

  test("rethrows unexpected insert errors", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    createManyMock.mockRejectedValue(new Error("db down"));

    await expect(incrementAvailableCount("org_1")).rejects.toThrow("db down");
  });
});

describe("decrementAvailableCount", () => {
  test("throws without writing when orgId is empty", async () => {
    await expect(decrementAvailableCount("")).rejects.toThrow("Unauthorized");
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("decrements only when the stored count is greater than 0", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    await decrementAvailableCount("org_1");

    expect(authMock).not.toHaveBeenCalled();
    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
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
