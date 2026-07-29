import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { milliseconds } from "date-fns";

const DAY_IN_MS = milliseconds({ days: 1 });

/**
 * Whether the current Clerk organization has an active Pro plan subscription.
 * Overview + isPro vs stripeCustomerId: docs/stripe.md (Gotchas).
 * Cancel / failed-pay lifecycle gaps: docs/stripe.md → “Complete the current picture first”.
 *
 * Allows a 1-day grace past stripeCurrentPeriodEnd for webhook / clock skew.
 * Cancel in Customer Portal does not clear this instantly — see docs (Gotchas).
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
