import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PRO_PLAN } from "@/constants/pricing-plans";
import prisma from "@/lib/prisma/client";
import { toStripeCurrency, toStripeUnitAmount } from "@/lib/stripe";
import { orgAuth } from "@/lib/testing/org-auth";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { organizationSubscriptionFactory } from "@/lib/testing/factories/organization-subscription";

import { stripeRedirect } from "./index";

const stripeMocks = vi.hoisted(() => ({
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = { sessions: { create: stripeMocks.checkoutCreate } };
    billingPortal = { sessions: { create: stripeMocks.portalCreate } };
    constructor() {}
  },
}));

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const getOrgAuthMock = vi.mocked(getOrgAuth);
const currentUserMock = vi.mocked(currentUser);
const subscriptionFindUniqueMock = vi.mocked(
  prisma.organizationSubscription.findUnique,
);
const revalidatePathMock = vi.mocked(revalidatePath);

const clerkUser = {
  emailAddresses: [{ emailAddress: "ada@example.com" }],
} as Awaited<ReturnType<typeof currentUser>>;

const appUrl = "https://taskify.example";
const settingsUrl = `${appUrl}/organization/org_1`;

describe("stripeRedirect", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
  });

  test("returns Unauthorized without writing when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const result = await stripeRedirect({});

    expect(currentUserMock).not.toHaveBeenCalled();
    expect(subscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(stripeMocks.checkoutCreate).not.toHaveBeenCalled();
    expect(stripeMocks.portalCreate).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("returns Unauthorized without writing when there is no user", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(null);

    const result = await stripeRedirect({});

    expect(subscriptionFindUniqueMock).not.toHaveBeenCalled();
    expect(stripeMocks.checkoutCreate).not.toHaveBeenCalled();
    expect(stripeMocks.portalCreate).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Unauthorized" });
  });

  test("opens Checkout for the session org when there is no Stripe customer", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(clerkUser);
    subscriptionFindUniqueMock.mockResolvedValue(null);
    stripeMocks.checkoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/cs_test",
    });

    const result = await stripeRedirect({});

    expect(subscriptionFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(stripeMocks.portalCreate).not.toHaveBeenCalled();
    expect(stripeMocks.checkoutCreate).toHaveBeenCalledExactlyOnceWith({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: "ada@example.com",
      line_items: [
        {
          price_data: {
            currency: toStripeCurrency(PRO_PLAN.priceMonthly),
            product_data: {
              name: PRO_PLAN.name,
              description: PRO_PLAN.stripeProductDescription,
            },
            unit_amount: toStripeUnitAmount(PRO_PLAN.priceMonthly),
            recurring: {
              interval: PRO_PLAN.interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orgId: "org_1",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/organization/org_1",
    );
    expect(result).toStrictEqual({
      data: "https://checkout.stripe.com/cs_test",
    });
  });

  test("opens Checkout when the org row has no stripeCustomerId", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(clerkUser);
    subscriptionFindUniqueMock.mockResolvedValue(
      organizationSubscriptionFactory.build({
        orgId: "org_1",
        stripeCustomerId: null,
      }),
    );
    stripeMocks.checkoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/cs_test",
    });

    const result = await stripeRedirect({});

    expect(subscriptionFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(stripeMocks.portalCreate).not.toHaveBeenCalled();
    expect(stripeMocks.checkoutCreate).toHaveBeenCalledOnce();
    expect(result).toStrictEqual({
      data: "https://checkout.stripe.com/cs_test",
    });
  });

  test("opens the Customer Portal for the session org's Stripe customer", async () => {
    const subscription = organizationSubscriptionFactory.build({
      orgId: "org_1",
    });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(clerkUser);
    subscriptionFindUniqueMock.mockResolvedValue(subscription);
    stripeMocks.portalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session",
    });

    const result = await stripeRedirect({});

    expect(subscriptionFindUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { orgId: "org_1" },
    });
    expect(stripeMocks.checkoutCreate).not.toHaveBeenCalled();
    expect(stripeMocks.portalCreate).toHaveBeenCalledExactlyOnceWith({
      customer: subscription.stripeCustomerId,
      return_url: settingsUrl,
    });
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith(
      "/organization/org_1",
    );
    expect(result).toStrictEqual({
      data: "https://billing.stripe.com/session",
    });
  });

  test("returns Something went wrong when Stripe omits a Checkout URL", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(clerkUser);
    subscriptionFindUniqueMock.mockResolvedValue(null);
    stripeMocks.checkoutCreate.mockResolvedValue({ url: null });

    const result = await stripeRedirect({});

    expect(stripeMocks.portalCreate).not.toHaveBeenCalled();
    expect(stripeMocks.checkoutCreate).toHaveBeenCalledOnce();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Something went wrong." });
  });

  test("returns Something went wrong when Stripe throws", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue(clerkUser);
    subscriptionFindUniqueMock.mockResolvedValue(null);
    stripeMocks.checkoutCreate.mockRejectedValue(new Error("stripe down"));

    const result = await stripeRedirect({});

    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ serverError: "Something went wrong." });
  });
});
