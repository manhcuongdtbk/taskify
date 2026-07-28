import { dinero } from "dinero.js";
import { USD } from "dinero.js/currencies";

/**
 * Taskify Pro monthly price ($20.00 USD).
 * Dinero `amount` is in minor units (cents) — same as Stripe `unit_amount`.
 */
export const TASKIFY_PRO_MONTHLY = dinero({ amount: 2000, currency: USD });
