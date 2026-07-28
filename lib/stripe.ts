import Stripe from "stripe";
import { fromUnixTime } from "date-fns";

/**
 * Shared Stripe client + helpers for this app.
 * Bird’s-eye flow + diagrams: docs/stripe.md
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

/**
 * Convert a Stripe timestamp to a JS Date.
 * Stripe uses Unix seconds; JS Date uses milliseconds.
 * Prefer this over `new Date(unixSeconds * 1000)` so the unit conversion stays in one place.
 */
export const stripeTimestampToDate = (unixSeconds: number): Date => {
  return fromUnixTime(unixSeconds);
};

/**
 * Convert whole major-unit amounts (e.g. integer dollars) to Stripe's smallest
 * currency unit (cents for USD). Exact integer math only — no floats / Math.round,
 * which are unsafe for money. For fractional prices, define unit_amount in cents
 * as an integer constant instead of converting from a decimal.
 */
export const toStripeUnitAmount = (majorUnits: number): number => {
  if (!Number.isInteger(majorUnits)) {
    throw new Error(
      "toStripeUnitAmount expects a whole number of major units (e.g. 20 dollars), not a float",
    );
  }
  return majorUnits * 100;
};
