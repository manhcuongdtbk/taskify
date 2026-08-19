/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `organizationSubscriptionFactory` → Prisma `OrganizationSubscription` row
 */

import { addDays, constructNow } from "date-fns";
import { Factory } from "fishery";

import { type OrganizationSubscription } from "@/app/generated/prisma/client";

export const organizationSubscriptionFactory =
  Factory.define<OrganizationSubscription>(({ sequence }) => {
    const instant = constructNow(undefined);

    return {
      id: `organizationSubscription_${sequence}`,
      orgId: `org_${sequence}`,
      stripeCustomerId: `cus_${sequence}`,
      stripeSubscriptionId: `sub_${sequence}`,
      stripePriceId: `price_${sequence}`,
      stripeCurrentPeriodEnd: addDays(instant, 30),
      createdAt: instant,
      updatedAt: instant,
    };
  });

export const rewindOrganizationSubscriptionFactory = () => {
  organizationSubscriptionFactory.rewindSequence();
};
