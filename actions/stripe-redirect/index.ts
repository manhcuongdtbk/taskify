"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { StripeRedirect } from "./schema";
import { absoluteUrl } from "@/lib/utils";
import { stripe } from "@/lib/stripe";

/**
 * Start Stripe billing for the current org.
 * Overview: docs/stripe.md
 *
 * - No stripeCustomerId yet → Checkout Session (mode: subscription).
 *   Puts orgId in session metadata so app/api/webhook can link the subscription.
 * - Already a Stripe customer → Customer Portal (manage/cancel/update card).
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

  const settingsUrl = absoluteUrl(`/organization/${orgId}`);

  let url = "";

  try {
    const organizationSubscription =
      await prisma.organizationSubscription.findUnique({
        where: {
          orgId,
        },
      });

    // Existing subscriber → manage billing in Stripe's Customer Portal.
    if (organizationSubscription && organizationSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: organizationSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });

      url = stripeSession.url;
    } else {
      // First upgrade → hosted Checkout. metadata.orgId is required by the webhook.
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: settingsUrl,
        cancel_url: settingsUrl,
        // TODO: omit payment_method_types — Stripe recommends leaving it unset so
        // Dashboard dynamic payment methods apply. Hardcoding ["card"] locks out
        // other methods. See https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.emailAddresses[0].emailAddress,
        line_items: [
          {
            price_data: {
              currency: "USD",
              product_data: {
                name: "Taskify Pro",
                description: "Unlimited boards for your organization",
              },
              unit_amount: 2000,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          orgId,
        },
      });

      url = stripeSession.url || "";
    }
  } catch (error) {
    // TODO: unused `error` — log it (or use `catch {`) so failures are debuggable without an eslint unused-var warning.
    return { error: "Something went wrong." };
  }

  revalidatePath(`/organization/${orgId}`);

  return { data: url };
};

export const stripeRedirect = createSafeAction(StripeRedirect, handler);
