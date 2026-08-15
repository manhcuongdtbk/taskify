/**
 * Marketplace `uses:` pin policy for `pnpm lint:workflows`.
 * CLI: scripts/check-github-workflow-tooling.ts. Docs: docs/conventions.md.
 */

import { isJSONObject } from "es-toolkit";

/** Used when GitHub’s API is unreachable (offline lint). Prefer live latest. */
export const FALLBACK_LATEST_MAJOR: Record<string, number> = {
  "actions/checkout": 7,
  "actions/setup-node": 7,
  "jdx/mise-action": 4,
};

export const pinFloorMajor = (
  fallbackMajor: number | undefined,
  adoptedMajors: readonly number[],
): number | undefined => {
  const adopted =
    adoptedMajors.length > 0 ? Math.max(...adoptedMajors) : undefined;

  if (fallbackMajor == null) {
    return adopted;
  }

  if (adopted == null) {
    return fallbackMajor;
  }

  return Math.max(fallbackMajor, adopted);
};

export type MarketplacePinVerdict =
  | { severity: "ok" }
  | { severity: "error"; message: string }
  | { severity: "warn"; message: string };

export const majorFromRef = (ref: string): number | null => {
  const match = /^v?(\d+)/.exec(ref);
  return match ? Number(match[1]) : null;
};

/** Highest floating major tag (`v7`, not `v7.0.1`). */
export const latestMajorFromTagRefs = (body: unknown): number | null => {
  if (!Array.isArray(body)) {
    return null;
  }

  const majors: number[] = [];
  for (const item of body) {
    if (!isJSONObject(item) || typeof item.ref !== "string") {
      continue;
    }
    const tag = item.ref.replace(/^refs\/tags\//u, "");
    if (!/^v\d+$/u.test(tag)) {
      continue;
    }
    majors.push(Number.parseInt(tag.slice(1), 10));
  }

  return majors.length > 0 ? Math.max(...majors) : null;
};

/**
 * Fail on a pin older than this repo’s floor (`FALLBACK_LATEST_MAJOR` raised
 * by the highest floating major already used for that action) or a
 * non-floating ref. A live GitHub major newer than the pin is a warning so
 * Dependabot can bump without turning every PR red.
 */
export const evaluateMarketplacePin = ({
  spec,
  rel,
  ref,
  liveMajor,
  floorMajor,
}: {
  spec: string;
  rel: string;
  ref: string;
  liveMajor: number | null;
  floorMajor: number | undefined;
}): MarketplacePinVerdict => {
  const usedMajor = majorFromRef(ref);
  const exampleMajor = liveMajor ?? floorMajor ?? usedMajor ?? "N";

  if (!/^v\d+$/.test(ref)) {
    return {
      severity: "error",
      message: `${rel}: ${spec} must be the current major tag (e.g. @v${exampleMajor}) unless listed in ACTION_PIN_EXCEPTIONS with a reason`,
    };
  }

  if (floorMajor != null && usedMajor != null && usedMajor < floorMajor) {
    return {
      severity: "error",
      message: `${rel}: ${spec} is behind this repo’s current major (@v${floorMajor}) — bump it, or add ACTION_PIN_EXCEPTIONS with a reason`,
    };
  }

  if (liveMajor != null && usedMajor != null && usedMajor < liveMajor) {
    return {
      severity: "warn",
      message: `${rel}: ${spec} is behind GitHub’s latest major (@v${liveMajor}); Dependabot should open a bump PR. Not failing this check.`,
    };
  }

  return { severity: "ok" };
};
