import { dinero, type Dinero } from "dinero.js";
import { USD } from "dinero.js/currencies";

/**
 * Single source of truth for **pricing plans** (commercial / access tiers).
 * Docs should describe plans as defined here — update docs in the same change
 * when you add or rename one. Word meanings: `docs/vocabulary.md`.
 *
 * Today: **Free** (default, board limits) and **Pro** (monthly). More expected;
 * keep definitions in this module. Product display name: `siteConfig.name`.
 *
 * ## `maxBoards`
 *
 * - A **positive integer** (≥ 1) — that pricing plan is capped (e.g. Free allows 5 boards).
 * - **`null`** — that pricing plan has **unlimited** boards (Pro today).
 *
 * Never use `0` or a negative number as a “cap” — entitlement math treats the value as an
 * upper bound (`count < maxBoards`). Call sites should use `hasUnlimitedBoards(plan)`
 * (or `formatBoardLimit`) — not hardcode “Unlimited” from the plan id, and not re-check
 * `maxBoards === null` inline.
 * Pro’s value is `null` on purpose so UI/limits read the same field as Free;
 * a future paid pricing plan can switch to a number without inventing a second
 * convention.
 *
 * ## Types (`FreePlan`, `ProPlan`, …)
 *
 * Named types + `satisfies` are the **shape contract** for each entry in `PLANS`.
 * Call sites mostly use `FREE_PLAN` / `PRO_PLAN` (or `PLANS.*`) and get values from
 * `as const`; the types still matter as the base for growth:
 *
 * - Exporting a pricing-plan type or a `Plan` union for parameters / return types
 * - Narrowing (`plan.id === "pro"` → paid fields available)
 * - Lists / maps (`Plan[]`, `Record<PlanId, Plan>`) or factory helpers
 * - Adding another paid pricing plan with the same fields as Pro (extract a shared
 *   `PaidPlan` / extend the union) without rewriting every consumer
 *
 * When you add a pricing plan: new `PLAN_IDS` key, a named `*Plan` type, a `PLANS`
 * entry with `satisfies`, exports as needed, and docs. Prefer extending this
 * pattern over ad-hoc constants elsewhere.
 */

export const PLAN_IDS = {
  free: "free",
  pro: "pro",
} as const;

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

/** Default pricing-plan shape — limits, no Stripe price fields. */
type FreePlan = {
  id: typeof PLAN_IDS.free;
  name: "Free";
  /** Max boards allowed on the Free pricing plan (positive integer ≥ 1). */
  maxBoards: number;
};

/**
 * Paid pricing-plan shape — Stripe Checkout fields live here.
 * Future paid pricing plans will likely share this shape (or a common `PaidPlan` base).
 * Checkout `product_data.name` uses `name` (same as UI).
 */
type ProPlan = {
  id: typeof PLAN_IDS.pro;
  name: "Pro";
  /**
   * Board cap for this pricing plan.
   * `null` = unlimited (convention shared by all pricing plans — see module header).
   * Pro is `null` today; do not assume every paid pricing plan always will be.
   */
  maxBoards: null;
  /** Monthly price (Dinero minor units — same as Stripe `unit_amount`). */
  priceMonthly: Dinero<number>;
  /** Stripe Checkout `price_data.product_data.description`. */
  stripeProductDescription: string;
  interval: "month";
};

export const PLANS = {
  free: {
    id: PLAN_IDS.free,
    name: "Free",
    maxBoards: 5,
  } satisfies FreePlan,
  pro: {
    id: PLAN_IDS.pro,
    name: "Pro",
    maxBoards: null,
    priceMonthly: dinero({ amount: 2000, currency: USD }),
    stripeProductDescription: "Unlimited boards for your organization",
    interval: "month",
  } satisfies ProPlan,
} as const;

export const FREE_PLAN = PLANS.free;
export const PRO_PLAN = PLANS.pro;

/** Capped plans only — rejects 0, negatives, and non-integers. */
function assertPositiveMaxBoards(maxBoards: number): void {
  if (!Number.isInteger(maxBoards) || maxBoards < 1) {
    throw new Error(
      `maxBoards must be a positive integer (≥ 1), got ${String(maxBoards)}`,
    );
  }
}

for (const plan of Object.values(PLANS)) {
  if (plan.maxBoards !== null) {
    assertPositiveMaxBoards(plan.maxBoards);
  }
}

/**
 * Whether a pricing plan allows unlimited boards.
 * True iff `maxBoards === null` (see module header “maxBoards”).
 */
export const hasUnlimitedBoards = (plan: {
  maxBoards: number | null;
}): boolean => {
  return plan.maxBoards === null;
};

/**
 * UI copy for a pricing plan’s board cap.
 * `null` → “Unlimited boards”; otherwise “Up to N boards” (N must be a positive integer).
 */
export const formatBoardLimit = (maxBoards: number | null): string => {
  if (maxBoards === null) {
    return "Unlimited boards";
  }
  assertPositiveMaxBoards(maxBoards);
  return `Up to ${maxBoards} boards`;
};
