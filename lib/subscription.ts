import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { addDays, isFuture } from "date-fns";

/**
 * Whether the current Clerk organization has an active Pro plan subscription.
 * Overview: `docs/billing.md`.
 *
 * Allows a 1-day grace past stripeCurrentPeriodEnd for webhook / clock skew.
 * Cancel in Customer Portal does not clear this instantly — see `docs/billing.md`.
 *
 * React `cache` is request-scoped memoization (page + create-board UI in one
 * RSC render). Not Redis / Data Cache. Server Actions are a new request.
 * docs/data.md
 */
export const checkSubscription = cache(async () => {
  const { orgId } = await auth();

  if (!orgId) {
    return false;
  }

  const organizationSubscription =
    await prisma.organizationSubscription.findUnique({
      where: {
        orgId,
      },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripePriceId: true,
        stripeCustomerId: true,
      },
    });

  if (!organizationSubscription) {
    return false;
  }

  const { stripePriceId, stripeCurrentPeriodEnd } = organizationSubscription;
  // Calendar day, not exactly 24h (`milliseconds({ days: 1 })`). DST can make
  // addDays 23h or 25h; this grace is for webhook / clock skew, so that gap
  // does not matter. Prefer addDays so the 1-day intent is obvious.
  const isValid =
    stripePriceId &&
    stripeCurrentPeriodEnd != null &&
    isFuture(addDays(stripeCurrentPeriodEnd, 1));

  return !!isValid;
});
