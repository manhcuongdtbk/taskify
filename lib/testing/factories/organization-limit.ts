/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `organizationLimitFactory` → Prisma `OrganizationLimit` row
 */

import { constructNow } from "date-fns";
import { Factory } from "fishery";

import { type OrganizationLimit } from "@/app/generated/prisma/client";

export const organizationLimitFactory = Factory.define<OrganizationLimit>(
  ({ sequence }) => {
    const instant = constructNow(undefined);

    return {
      id: `organizationLimit_${sequence}`,
      orgId: `org_${sequence}`,
      count: 0,
      createdAt: instant,
      updatedAt: instant,
    };
  },
);

export const rewindOrganizationLimitFactory = () => {
  organizationLimitFactory.rewindSequence();
};
