import { describe, expect, test } from "vitest";

import {
  evaluateMarketplacePin,
  latestMajorFromTagRefs,
  majorFromRef,
  pinFloorMajor,
} from "./github-workflow-pins";

describe("majorFromRef", () => {
  test("reads a floating major tag", () => {
    expect(majorFromRef("v7")).toBe(7);
  });

  test("returns null when the ref has no leading version number", () => {
    expect(majorFromRef("deadbeef")).toBeNull();
  });
});

describe("latestMajorFromTagRefs", () => {
  test("returns the highest floating vN tag", () => {
    expect(
      latestMajorFromTagRefs([
        { ref: "refs/tags/v7" },
        { ref: "refs/tags/v7.0.1" },
        { ref: "refs/tags/v8" },
      ]),
    ).toBe(8);
  });

  test("returns null when the body is not a tag list", () => {
    expect(latestMajorFromTagRefs({ message: "Not Found" })).toBeNull();
  });

  test("skips non-object rows and non-string refs", () => {
    expect(
      latestMajorFromTagRefs(["v7", { ref: 7 }, { ref: "refs/tags/v4" }]),
    ).toBe(4);
  });

  test("returns null when there are no floating major tags", () => {
    expect(latestMajorFromTagRefs([{ ref: "refs/tags/v7.0.1" }])).toBeNull();
  });
});

describe("pinFloorMajor", () => {
  test("raises the documented floor to the highest major already pinned in the repo", () => {
    expect(pinFloorMajor(7, [7, 8])).toBe(8);
  });

  test("keeps the documented floor when the repo has not adopted a newer major", () => {
    expect(pinFloorMajor(7, [7])).toBe(7);
  });

  test("uses adopted majors when there is no documented floor", () => {
    expect(pinFloorMajor(undefined, [2])).toBe(2);
  });

  test("uses the documented floor when no floating majors are adopted yet", () => {
    expect(pinFloorMajor(7, [])).toBe(7);
  });
});

describe("evaluateMarketplacePin", () => {
  const pin = {
    spec: "actions/checkout@v7",
    rel: ".github/workflows/ci.yml",
    ref: "v7",
    floorMajor: 7,
  };

  test("accepts a floating major at the documented floor", () => {
    expect(evaluateMarketplacePin({ ...pin, liveMajor: 7 })).toStrictEqual({
      severity: "ok",
    });
  });

  test("warns when GitHub has a newer major than the pin", () => {
    expect(evaluateMarketplacePin({ ...pin, liveMajor: 8 })).toStrictEqual({
      severity: "warn",
      message:
        ".github/workflows/ci.yml: actions/checkout@v7 is behind GitHub’s latest major (@v8); Dependabot should open a bump PR. Not failing this check.",
    });
  });

  test("warns for a live newer major even when this repo has no floor for that action", () => {
    expect(
      evaluateMarketplacePin({
        spec: "acme/tool@v1",
        rel: ".github/actions/setup-mise/action.yml",
        ref: "v1",
        liveMajor: 2,
        floorMajor: undefined,
      }),
    ).toMatchObject({ severity: "warn" });
  });

  test("errors when the pin is behind this repo’s documented floor", () => {
    expect(
      evaluateMarketplacePin({
        spec: "actions/checkout@v6",
        rel: ".github/workflows/ci.yml",
        ref: "v6",
        liveMajor: 8,
        floorMajor: 7,
      }),
    ).toStrictEqual({
      severity: "error",
      message:
        ".github/workflows/ci.yml: actions/checkout@v6 is behind this repo’s current major (@v7) — bump it, or add ACTION_PIN_EXCEPTIONS with a reason",
    });
  });

  test("errors on a commit SHA pin", () => {
    expect(
      evaluateMarketplacePin({
        spec: "actions/checkout@deadbeef",
        rel: ".github/workflows/ci.yml",
        ref: "deadbeef",
        liveMajor: null,
        floorMajor: undefined,
      }),
    ).toStrictEqual({
      severity: "error",
      message:
        ".github/workflows/ci.yml: actions/checkout@deadbeef must be the current major tag (e.g. @vN) unless listed in ACTION_PIN_EXCEPTIONS with a reason",
    });
  });

  test("errors on a patch pin", () => {
    expect(
      evaluateMarketplacePin({
        spec: "actions/checkout@v7.0.1",
        rel: ".github/workflows/ci.yml",
        ref: "v7.0.1",
        liveMajor: 7,
        floorMajor: 7,
      }),
    ).toStrictEqual({
      severity: "error",
      message:
        ".github/workflows/ci.yml: actions/checkout@v7.0.1 must be the current major tag (e.g. @v7) unless listed in ACTION_PIN_EXCEPTIONS with a reason",
    });
  });

  test("errors when a pin is behind a major this repo already adopted", () => {
    expect(
      evaluateMarketplacePin({
        spec: "actions/checkout@v7",
        rel: ".github/workflows/ci.yml",
        ref: "v7",
        liveMajor: 8,
        floorMajor: pinFloorMajor(7, [8]),
      }),
    ).toMatchObject({ severity: "error" });
  });

  test("still errors on a stale floor pin when GitHub’s API is unreachable", () => {
    expect(
      evaluateMarketplacePin({
        spec: "actions/checkout@v6",
        rel: ".github/workflows/ci.yml",
        ref: "v6",
        liveMajor: null,
        floorMajor: 7,
      }),
    ).toMatchObject({ severity: "error" });
  });
});
