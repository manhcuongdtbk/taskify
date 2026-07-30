"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { StripeRedirect } from "./schema";
import { absoluteUrl } from "@/lib/utils";
import { stripe, toStripeCurrency, toStripeUnitAmount } from "@/lib/stripe";
import { PRO_PLAN } from "@/constants/pricing-plans";

/**
 * Start Stripe billing for the current organization.
 *
 * Concepts (Checkout vs Customer Portal / Billing Portal, modes, webhooks):
 *   docs/billing.md → “Stripe concepts (read this first)”
 * Prioritized hardening / polish (log errors, payment_method_types, etc.):
 *   docs/billing.md → “Complete the current picture first”
 *
 * - No stripeCustomerId yet → Checkout Session (mode: subscription) to start Pro.
 *   Puts orgId in session metadata so app/api/webhook can link the subscription.
 * - Already a Stripe customer → Customer Portal (SDK: billingPortal.sessions) to
 *   manage/cancel/update card. “Billing Portal” in the API name = Customer Portal in docs.
 */
const handler = async (data: InputType): Promise<ReturnType> => {
  // TODO: unused `data` — schema is empty today; prefix with `_` or use fields once Checkout needs input.
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    return {
      error: "Unauthorized",
    };
  }

  // After Checkout / Portal the user returns here. This is navigation only —
  // Pro access is provisioned by app/api/webhook, not by landing on this URL.
  const settingsUrl = absoluteUrl(`/organization/${orgId}`);

  let url = "";

  try {
    const organizationSubscription =
      await prisma.organizationSubscription.findUnique({
        where: {
          orgId,
        },
      });

    // Existing subscriber → Customer Portal (docs name). SDK: billingPortal.sessions.
    // Same product as “Billing Portal” — not a second kind of portal. Not Checkout.
    if (organizationSubscription && organizationSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: organizationSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });

      url = stripeSession.url;
    } else {
      // First upgrade → Checkout (hosted pay page). mode: "subscription" = recurring Pro.
      // Other Checkout modes we don't use yet: "payment" (one-time), "setup" (save card only).
      // Inline price_data is demo-friendly; production often uses Dashboard price_… ids.
      // See docs/billing.md → Stripe concepts, Gotchas, Opening more doors.
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: settingsUrl,
        cancel_url: settingsUrl,
        // TODO (P2 — docs/billing.md “Complete the current picture first”): omit
        // payment_method_types — Stripe recommends leaving it unset so
        // Dashboard dynamic payment methods apply. Hardcoding ["card"] locks out
        // other methods. See https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods
        payment_method_types: ["card"],
        // Recurring subscription (not a one-time payment).
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.emailAddresses[0].emailAddress,
        line_items: [
          {
            // Inline price_data creates Product/Price on the fly (handy for demos).
            // Production apps often pass a fixed Dashboard price id: price: "price_...".
            price_data: {
              currency: toStripeCurrency(PRO_PLAN.priceMonthly),
              product_data: {
                name: PRO_PLAN.name,
                description: PRO_PLAN.stripeProductDescription,
              },
              // Dinero amount is already Stripe's minor-unit integer.
              unit_amount: toStripeUnitAmount(PRO_PLAN.priceMonthly),
              recurring: {
                interval: PRO_PLAN.interval,
              },
            },
            quantity: 1,
          },
        ],
        // Copied onto checkout.session.completed so the webhook can link org ↔ subscription.
        metadata: {
          orgId,
        },
      });

      url = stripeSession.url || "";
    }
  } catch (error) {
    // TODO: unused `error` (P0 — docs/billing.md “Complete the current picture first”) —
    // log it (or use `catch {`) so failures are debuggable without an eslint unused-var warning.
    return { error: "Something went wrong." };
  }

  revalidatePath(`/organization/${orgId}`);

  // Caller redirects the browser to this Stripe-hosted URL.
  return { data: url };
};

export const stripeRedirect = createSafeAction(StripeRedirect, handler);
