import { cache } from "react";
import prisma from "@/lib/prisma/client";
import { addDays, isFuture } from "date-fns";
import { getOrgAuth } from "@/lib/auth/get-org-auth";

type OrganizationSubscriptionReader = {
  organizationSubscription: Pick<
    typeof prisma.organizationSubscription,
    "findUnique"
  >;
};

// Calendar day, not exactly 24h (`milliseconds({ days: 1 })`). DST can make
// addDays 23h or 25h; this grace is for webhook / clock skew, so that gap
// does not matter. Prefer addDays so the 1-day intent is obvious.
const isActiveProSubscription = (
  stripePriceId: string | null,
  stripeCurrentPeriodEnd: Date | null,
) =>
  Boolean(
    stripePriceId &&
    stripeCurrentPeriodEnd != null &&
    isFuture(addDays(stripeCurrentPeriodEnd, 1)),
  );

/**
 * Pro access for a known `orgId`. Pass the interactive-transaction client so
 * board create/delete decide the plan in the same snapshot as the slot write.
 * docs/prisma.md
 */
export const isProOrganization = async (
  orgId: string,
  db: OrganizationSubscriptionReader = prisma,
) => {
  if (!orgId) {
    // Fail fast for transactional callers: without an `orgId`, we cannot
    // scope the subscription row correctly. `createSafeAction` should
    // guarantee this for Server Actions, but keeping the throw makes any
    // invariant breach obvious during development/testing.
    throw new Error("Unauthorized");
  }

  const organizationSubscription = await db.organizationSubscription.findUnique(
    {
      where: {
        orgId,
      },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    },
  );

  if (!organizationSubscription) {
    return false;
  }

  return isActiveProSubscription(
    organizationSubscription.stripePriceId,
    organizationSubscription.stripeCurrentPeriodEnd,
  );
};

/**
 * Whether the current Clerk organization has an active Pro plan subscription.
 * Overview: `docs/billing.md`.
 *
 * Allows a 1-day grace past stripeCurrentPeriodEnd for webhook / clock skew.
 * Cancel in Customer Portal does not clear this instantly — see `docs/billing.md`.
 *
 * React `cache` is request-scoped memoization (org page `isPro` + create-board
 * tile remaining copy in one RSC render — both call `checkSubscription()` with
 * no args so they share the cache key). Not Redis / Data Cache. Server
 * Actions are a new request.
 * docs/data.md
 */
export const checkSubscription = cache(async () => {
  const orgId = (await getOrgAuth())?.orgId;

  if (!orgId) {
    return false;
  }

  return isProOrganization(orgId);
});
