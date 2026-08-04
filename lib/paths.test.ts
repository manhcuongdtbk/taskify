import { describe, expect, test } from "vitest";

import { paths } from "./paths";

describe("paths", () => {
  test("static auth and org-select routes", () => {
    expect(paths.signIn).toBe("/sign-in");
    expect(paths.signUp).toBe("/sign-up");
    expect(paths.selectOrg).toBe("/select-org");
  });

  test("board route", () => {
    expect(paths.board("board_123")).toBe("/board/board_123");
  });

  test.for([
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
  ])("$name", ({ actual, expected }) => {
    expect(actual).toBe(expected);
  });
});
