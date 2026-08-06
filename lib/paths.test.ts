import { describe, expect, test } from "vitest";

import { paths } from "./paths";

describe("paths", () => {
  test.for([
    { name: "signIn", actual: paths.signIn, expected: "/sign-in" },
    { name: "signUp", actual: paths.signUp, expected: "/sign-up" },
    { name: "selectOrg", actual: paths.selectOrg, expected: "/select-org" },
  ])("static route $name", ({ actual, expected }) => {
    expect(actual).toBe(expected);
  });

  test.for([
    {
      name: "board",
      actual: paths.board("board_123"),
      expected: "/board/board_123",
    },
    {
      name: "organization",
      actual: paths.organization("org_1"),
      expected: "/organization/org_1",
    },
    {
      name: "organizationActivity",
      actual: paths.organizationActivity("org_1"),
      expected: "/organization/org_1/activity",
    },
    {
      name: "organizationSettings",
      actual: paths.organizationSettings("org_1"),
      expected: "/organization/org_1/settings",
    },
    {
      name: "organizationBilling",
      actual: paths.organizationBilling("org_1"),
      expected: "/organization/org_1/billing",
    },
  ])("dynamic route $name", ({ actual, expected }) => {
    expect(actual).toBe(expected);
  });
});
