import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { addDays } from "date-fns";

import prisma from "@/lib/prisma/client";
import { organizationSubscriptionFactory } from "@/lib/testing/factories/organization-subscription";

import { checkSubscription, isProOrganization } from "./subscription";

vi.mock("@/lib/prisma/client", () => ({
  default: { organizationSubscription: { findUnique: vi.fn() } },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const authMock = vi.mocked(auth);
const findUniqueMock = vi.mocked(prisma.organizationSubscription.findUnique);

const frozenNow = new Date("2026-06-15T12:00:00.000Z");

describe("isProOrganization", () => {
  test("throws without querying when orgId is empty", async () => {
    await expect(isProOrganization("")).rejects.toThrow("Unauthorized");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("checkSubscription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(frozenNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns false without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const result = await checkSubscription();

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test("skips auth when orgId is provided", async () => {
    // Avoid false negatives from prior tests.
    authMock.mockClear();
    findUniqueMock.mockClear();

    authMock.mockResolvedValue({ orgId: "SHOULD_NOT_CALL" } as Awaited<
      ReturnType<typeof auth>
    >);

    findUniqueMock.mockResolvedValue(
      organizationSubscriptionFactory.build({
        orgId: "org_1",
        stripePriceId: "price_pro",
        stripeCurrentPeriodEnd: addDays(frozenNow, 1),
      }),
    );

    const result = await checkSubscription("org_1");

    expect(authMock).not.toHaveBeenCalled();
    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    });
    expect(result).toBe(true);
  });

  test("returns false when the organization has no subscription row", async () => {
    authMock.mockResolvedValue({ orgId: "org_1" } as Awaited<
      ReturnType<typeof auth>
    >);
    findUniqueMock.mockResolvedValue(null);

    const result = await checkSubscription();

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    });
    expect(result).toBe(false);
  });

  test.for([
    {
      case: "the paid period is still in the future",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: addDays(frozenNow, 1),
      expected: true,
    },
    {
      case: "the paid period ended within the 1-day grace window",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date(
        frozenNow.getTime() - 12 * 60 * 60 * 1000,
      ),
      expected: true,
    },
    {
      case: "the paid period ended exactly one day ago",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: addDays(frozenNow, -1),
      expected: false,
    },
    {
      case: "the paid period is past the 1-day grace window",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: addDays(frozenNow, -2),
      expected: false,
    },
    {
      case: "stripePriceId is missing",
      stripePriceId: null,
      stripeCurrentPeriodEnd: addDays(frozenNow, 1),
      expected: false,
    },
    {
      case: "stripeCurrentPeriodEnd is missing",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: null,
      expected: false,
    },
  ])(
    "returns $expected when $case",
    async ({ stripePriceId, stripeCurrentPeriodEnd, expected }) => {
      authMock.mockResolvedValue({ orgId: "org_1" } as Awaited<
        ReturnType<typeof auth>
      >);
      findUniqueMock.mockResolvedValue(
        organizationSubscriptionFactory.build({
          orgId: "org_1",
          stripePriceId,
          stripeCurrentPeriodEnd,
        }),
      );

      const result = await checkSubscription();

      expect(findUniqueMock).toHaveBeenCalledOnce();
      expect(result).toBe(expected);
    },
  );
});
