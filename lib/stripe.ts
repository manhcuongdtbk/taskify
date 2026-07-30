import Stripe from "stripe";
import { fromUnixTime } from "date-fns";
import { toSnapshot, type Dinero } from "dinero.js";

/**
 * Shared Stripe client + helpers for this app.
 * Bird’s-eye flow + diagrams: docs/billing.md
 *
 * Money values use Dinero.js (integer minor units + currency). Pass those into
 * Stripe via toStripeUnitAmount / toStripeCurrency — do not use floats.
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

/** Stripe `unit_amount` — Dinero's minor-unit integer (e.g. cents for USD). */
export const toStripeUnitAmount = (money: Dinero<number>): number => {
  return toSnapshot(money).amount;
};

/** Stripe currency code (lowercase), e.g. "usd". */
export const toStripeCurrency = (money: Dinero<number>): string => {
  return toSnapshot(money).currency.code.toLowerCase();
};
