import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { milliseconds } from "date-fns";

const DAY_IN_MS = milliseconds({ days: 1 });

/**
 * Whether the current Clerk org has an active Taskify Pro subscription.
 * Overview: docs/stripe.md
 *
 * Allows a 1-day grace past stripeCurrentPeriodEnd for webhook / clock skew.
 */
export const checkSubscription = async () => {
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

  const isValid =
    organizationSubscription.stripePriceId &&
    // TODO: is there a better way to handle this rather than disabling the rule?
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    organizationSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS >
      Date.now();

  return !!isValid;
};
