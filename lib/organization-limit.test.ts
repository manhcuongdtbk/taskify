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
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const authMock = vi.mocked(auth);
const findUniqueMock = vi.mocked(prisma.organizationLimit.findUnique);
const updateMock = vi.mocked(prisma.organizationLimit.update);
const createMock = vi.mocked(prisma.organizationLimit.create);

const orgAuth = { orgId: "org_1" } as Awaited<ReturnType<typeof auth>>;

describe("incrementAvailableCount", () => {
  test("throws without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(incrementAvailableCount()).rejects.toThrow("Unauthorized");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  test("increments the existing organization limit count", async () => {
    const organizationLimit = organizationLimitFactory.build({
      orgId: "org_1",
      count: 2,
    });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(organizationLimit);
    updateMock.mockResolvedValue({ ...organizationLimit, count: 3 });

    await incrementAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(updateMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 3 },
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  test("creates a count of 1 when the organization has no limit row", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue(
      organizationLimitFactory.build({ orgId: "org_1", count: 1 }),
    );

    await incrementAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(createMock).toHaveBeenCalledExactlyOnceWith({
      data: { orgId: "org_1", count: 1 },
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("decrementAvailableCount", () => {
  test("throws without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(decrementAvailableCount()).rejects.toThrow("Unauthorized");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  test("decrements the existing organization limit count", async () => {
    const organizationLimit = organizationLimitFactory.build({
      orgId: "org_1",
      count: 2,
    });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(organizationLimit);
    updateMock.mockResolvedValue({ ...organizationLimit, count: 1 });

    await decrementAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(updateMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 1 },
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  test("keeps count at 0 when decrementing an already-zero row", async () => {
    const organizationLimit = organizationLimitFactory.build({
      orgId: "org_1",
      count: 0,
    });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(organizationLimit);
    updateMock.mockResolvedValue(organizationLimit);

    await decrementAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(updateMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      data: { count: 0 },
    });
  });

  test("does not create a limit row when decrementing and none exists", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    await decrementAvailableCount();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
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
