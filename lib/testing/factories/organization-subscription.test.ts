import { beforeEach, describe, expect, test } from "vitest";

import {
  organizationSubscriptionFactory,
  rewindOrganizationSubscriptionFactory,
} from "./organization-subscription";

describe("organizationSubscriptionFactory", () => {
  beforeEach(() => {
    rewindOrganizationSubscriptionFactory();
  });

  test("builds an OrganizationSubscription row with sequenced defaults", () => {
    const organizationSubscription = organizationSubscriptionFactory.build();

    expect(organizationSubscription).toMatchObject({
      id: "organizationSubscription_1",
      orgId: "org_1",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      stripePriceId: "price_1",
    });
  });

  test("merges overrides", () => {
    const overrides = {
      orgId: "org_other",
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    };
    const organizationSubscription =
      organizationSubscriptionFactory.build(overrides);

    expect(organizationSubscription).toMatchObject(overrides);
  });
});
