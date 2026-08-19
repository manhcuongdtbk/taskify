import { beforeEach, describe, expect, test } from "vitest";

import {
  organizationLimitFactory,
  rewindOrganizationLimitFactory,
} from "./organization-limit";

describe("organizationLimitFactory", () => {
  beforeEach(() => {
    rewindOrganizationLimitFactory();
  });

  test("builds an OrganizationLimit row with sequenced defaults", () => {
    const organizationLimit = organizationLimitFactory.build();

    expect(organizationLimit).toMatchObject({
      id: "organizationLimit_1",
      orgId: "org_1",
      count: 0,
    });
  });

  test("merges overrides", () => {
    const overrides = { orgId: "org_other", count: 4 };
    const organizationLimit = organizationLimitFactory.build(overrides);

    expect(organizationLimit).toMatchObject(overrides);
  });
});
