import { describe, expect, test, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";

import { FREE_PLAN } from "@/constants/pricing-plans";
import prisma from "@/lib/prisma/client";
import { organizationLimitFactory } from "@/lib/testing/factories/organization-limit";

import {
  decrementAvailableCount,
  getAvailableCount,
  hasAvailableCount,
  incrementAvailableCount,
} from "./organization-limit";

vi.mock("@/lib/prisma/client", () => ({
  default: {
    organizationLimit: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const authMock = vi.mocked(auth);
const findUniqueMock = vi.mocked(prisma.organizationLimit.findUnique);
const createMock = vi.mocked(prisma.organizationLimit.create);
const updateManyMock = vi.mocked(prisma.organizationLimit.updateMany);

const orgAuth = { orgId: "org_1" } as Awaited<ReturnType<typeof auth>>;

describe("incrementAvailableCount", () => {
  test("throws without writing when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(incrementAvailableCount()).rejects.toThrow("Unauthorized");
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  test("increments when the stored count is below the Free plan cap", async () => {
    authMock.mockResolvedValue(orgAuth);
    updateManyMock.mockResolvedValue({ count: 1 });

    const reserved = await incrementAvailableCount();

    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { lt: FREE_PLAN.maxBoards } },
      data: { count: { increment: 1 } },
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(reserved).toBe(true);
  });

  test("creates a count of 1 when there is no limit row", async () => {
    const organizationLimit = organizationLimitFactory.build({
      orgId: "org_1",
      count: 1,
    });
    authMock.mockResolvedValue(orgAuth);
    updateManyMock.mockResolvedValue({ count: 0 });
    createMock.mockResolvedValue(organizationLimit);

    const reserved = await incrementAvailableCount();

    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { lt: FREE_PLAN.maxBoards } },
      data: { count: { increment: 1 } },
    });
    expect(createMock).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 1 },
    });
    expect(reserved).toBe(true);
  });

  test("retries the cap increment when a concurrent create wins the row", async () => {
    authMock.mockResolvedValue(orgAuth);
    updateManyMock
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    createMock.mockRejectedValue({ code: "P2002" });

    const reserved = await incrementAvailableCount();

    expect(createMock).toHaveBeenCalledOnce();
    expect(updateManyMock).toHaveBeenCalledTimes(2);
    expect(reserved).toBe(true);
  });

  test("returns false when the Free plan cap is already reached", async () => {
    authMock.mockResolvedValue(orgAuth);
    updateManyMock.mockResolvedValue({ count: 0 });
    createMock.mockRejectedValue({ code: "P2002" });

    const reserved = await incrementAvailableCount();

    expect(updateManyMock).toHaveBeenCalledTimes(2);
    expect(reserved).toBe(false);
  });

  test("rethrows unexpected create errors", async () => {
    authMock.mockResolvedValue(orgAuth);
    updateManyMock.mockResolvedValue({ count: 0 });
    createMock.mockRejectedValue(new Error("db down"));

    await expect(incrementAvailableCount()).rejects.toThrow("db down");
  });
});

describe("decrementAvailableCount", () => {
  test("throws without writing when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(decrementAvailableCount()).rejects.toThrow("Unauthorized");
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  test("decrements only when the stored count is greater than 0", async () => {
    authMock.mockResolvedValue(orgAuth);
    updateManyMock.mockResolvedValue({ count: 1 });

    await decrementAvailableCount();

    expect(updateManyMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1", count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("hasAvailableCount", () => {
  test("throws without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(hasAvailableCount()).rejects.toThrow("Unauthorized");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  test("returns true when the organization has no limit row", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    const result = await hasAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(result).toBe(true);
  });

  test("returns true when the board count is below the Free plan cap", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(
      organizationLimitFactory.build({
        orgId: "org_1",
        count: FREE_PLAN.maxBoards - 1,
      }),
    );

    const result = await hasAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(result).toBe(true);
  });

  test("returns false when the board count has reached the Free plan cap", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(
      organizationLimitFactory.build({
        orgId: "org_1",
        count: FREE_PLAN.maxBoards,
      }),
    );

    const result = await hasAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(result).toBe(false);
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
