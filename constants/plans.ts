import { dinero, type Dinero } from "dinero.js";
import { USD } from "dinero.js/currencies";

/**
 * Single source of truth for subscription plans.
 *
 * Docs (`docs/features.md`, `docs/stripe.md`) should describe plans as defined here —
 * when you add or rename a plan, update those docs in the same change.
 *
 * Today:
 * - **Free** — default plan (no Stripe subscription; board limits)
 * - **Pro** — paid plan (monthly Stripe subscription)
 *
 * Plan display name is **Pro**. Product display name is `siteConfig.name`
 * (`config/site.ts`); Pro is the plan.
 * More plans are expected; keep all plan definitions in this module.
 *
 * ## `maxBoards`
 *
 * - A **number** — that plan is capped (e.g. Free allows 5 boards).
 * - **`null`** — that plan has **unlimited** boards (Pro today).
 *
 * Call sites should use `hasUnlimitedBoards(plan)` (or `formatBoardLimit`) —
 * not hardcode “Unlimited” from the plan id, and not re-check `maxBoards === null`
 * inline.
 * Pro’s value is `null` on purpose so UI/limits read the same field as Free;
 * a future paid plan can switch to a number without inventing a second convention.
 *
 * ## Types (`FreePlan`, `ProPlan`, …)
 *
 * Named plan types + `satisfies` are the **shape contract** for each entry in `PLANS`.
 * Call sites mostly use `FREE_PLAN` / `PRO_PLAN` (or `PLANS.*`) and get values from
 * `as const`; the types still matter as the base for growth:
 *
 * - Exporting a plan type or a `Plan` union for parameters / return types
 * - Narrowing (`plan.id === "pro"` → paid fields available)
 * - Lists / maps (`Plan[]`, `Record<PlanId, Plan>`) or factory helpers
 * - Adding another paid plan with the same fields as Pro (extract a shared
 *   `PaidPlan` / extend the union) without rewriting every consumer
 *
 * When you add a plan: new `PLAN_IDS` key, a named `*Plan` type, a `PLANS` entry
 * with `satisfies`, exports as needed, and docs. Prefer extending this pattern
 * over ad-hoc constants elsewhere.
 */

export const PLAN_IDS = {
  free: "free",
  pro: "pro",
} as const;

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

/** Default plan shape — limits, no Stripe price fields. */
type FreePlan = {
  id: typeof PLAN_IDS.free;
  name: "Free";
  /** Max boards allowed on the Free plan. */
  maxBoards: number;
};

/**
 * Paid plan shape — Stripe Checkout fields live here.
 * Future paid plans will likely share this shape (or a common `PaidPlan` base).
 * Checkout `product_data.name` uses `name` (same as UI).
 */
type ProPlan = {
  id: typeof PLAN_IDS.pro;
  name: "Pro";
  /**
   * Board cap for this plan.
   * `null` = unlimited (convention shared by all plans — see module header).
   * Pro is `null` today; do not assume every paid plan always will be.
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

/**
 * Whether a plan allows unlimited boards.
 * True if `maxBoards === null` (see module header “maxBoards”).
 */
export function hasUnlimitedBoards(plan: {
  maxBoards: number | null;
}): boolean {
  return plan.maxBoards === null;
}

/**
 * UI copy for a plan’s board cap.
 * `null` → “Unlimited boards”; otherwise “Up to N boards”.
 */
export function formatBoardLimit(maxBoards: number | null): string {
  if (maxBoards === null) {
    return "Unlimited boards";
  }
  return `Up to ${maxBoards} boards`;
}
