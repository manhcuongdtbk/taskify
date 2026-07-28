import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, stripeTimestampToDate } from "@/lib/stripe";
import prisma from "@/lib/prisma";

/**
 * Stripe webhook endpoint.
 *
 * Stripe calls this route asynchronously when something happens on their side
 * (payment succeeded, subscription renewed, etc.). Your Checkout success_url
 * only means the user finished the hosted page — trust webhooks for provisioning.
 *
 * Project overview + diagrams: docs/stripe.md
 * Older API notes (tutorial archive): see bottom of this file.
 *
 * Stripe docs: https://docs.stripe.com/webhooks
 * Subscription events: https://docs.stripe.com/billing/subscriptions/webhooks
 */
export async function POST(req: Request) {
  // Must use the raw request body for signature verification.
  // If you parse JSON first (req.json()), constructEvent will fail.
  const body = await req.text();
  // TODO: Read more about headers in Next.js docs:
  //   - https://nextjs.org/docs/app/getting-started/route-handlers
  //   - https://nextjs.org/docs/app/api-reference/functions/headers
  const headersList = await headers();
  // Stripe-Signature proves the request really came from Stripe (HMAC of body + secret).
  // Never skip this in production — otherwise anyone could POST fake "payment succeeded" events.
  // headers().get() returns string | null; constructEvent expects a string. We cast here —
  // if the header is missing, constructEvent throws and we return 400 below.
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // Verifies signature + parses the Event. Throws if the signature is invalid
    // or STRIPE_WEBHOOK_SECRET does not match the endpoint that sent the event
    // (Dashboard endpoint secret vs Stripe CLI secret are different).
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    // TODO: unused `error` — log it (or use `catch {`) so failures are debuggable without an eslint unused-var warning.
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // Narrow by event.type before casting event.data.object (see older API notes below).

  // Fired once when the customer completes Checkout (mode: "subscription").
  // Use this to create our DB row that links Clerk orgId <-> Stripe subscription.
  // orgId comes from metadata we set in actions/stripe-redirect when creating the session.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session?.metadata?.orgId) {
      return new NextResponse("Organization ID is required", { status: 400 });
    }

    // For subscription mode, session.subscription is the new Subscription ID (sub_...).
    // Session itself does not include period end / price details we need — fetch Subscription next.
    if (!session.subscription) {
      return new NextResponse("Subscription ID is required", { status: 400 });
    }

    // Expand/fetch the full Subscription so we can store customer, price, and period end.
    // Webhook payloads are often "thin": IDs only, not every nested field.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Persist mirrored Stripe IDs — why each field exists: OrganizationSubscription in prisma/schema.prisma.
    await prisma.organizationSubscription.create({
      data: {
        orgId: session.metadata.orgId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: stripeTimestampToDate(
          subscription.items.data[0].current_period_end,
        ),
      },
    });
  }

  // Renew subscription
  // Fired when an invoice is paid successfully — first payment AND later renewals.
  // On renewals there is no new Checkout Session; Stripe bills the saved payment method
  // and sends this event. We update period end (and price, if they changed plans).
  //
  // TODO: First-payment race — Stripe may deliver invoice.payment_succeeded before
  // checkout.session.completed finishes creating organizationSubscription. The update
  // below then fails (record missing) → 500 until Stripe retries. Harden later, e.g.
  // ignore "not found", upsert, or only update when invoice.billing_reason is a renewal.
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.parent?.subscription_details?.subscription;

    // Non-subscription invoices (one-off) have no parent.subscription_details — skip those.
    if (!subscriptionId || typeof subscriptionId !== "string") {
      return new NextResponse("Subscription ID is required", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Look up by Stripe subscription id (not orgId) because renewals do not carry our metadata.
    await prisma.organizationSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: stripeTimestampToDate(
          subscription.items.data[0].current_period_end,
        ),
      },
    });
  }

  // Always acknowledge with 2xx quickly so Stripe does not retry.
  // Return 4xx/5xx only for real failures you want Stripe to retry.
  return new NextResponse(null, { status: 200 });
}

/*
 * =============================================================================
 * Older API notes (archive) — 2023-10-16 vs Basil-era Invoice/Subscription shape
 * =============================================================================
 * Frozen reference for tutorials that still use 2023-10-16. The live handler above
 * is source of truth for "current"; update this block only when debugging old guides,
 * not on every API version bump.
 *
 * --- 1. Invoice → subscription ID ---
 *
 * 2023-10-16: Invoice had a top-level `subscription` field:
 *
 *   if (event.type === "invoice.payment_succeeded") {
 *     const invoice = event.data.object as Stripe.Invoice;
 *     const subscription = await stripe.subscriptions.retrieve(
 *       invoice.subscription as string,
 *     );
 *   }
 *
 * Many tutorials incorrectly cast every event as Checkout.Session:
 *
 *   // Fragile: works on 2023-10-16 only because Invoice also had `.subscription`
 *   const session = event.data.object as Stripe.Checkout.Session;
 *   if (event.type === "invoice.payment_succeeded") {
 *     await stripe.subscriptions.retrieve(session.subscription as string);
 *   }
 *
 * That cast is still wrong on old APIs (wrong type), but often worked at runtime.
 *
 * Later APIs removed Invoice.subscription. Live code uses:
 *
 *   invoice.parent?.subscription_details?.subscription
 *
 * Using the old tutorial pattern yields: No such subscription: 'undefined'
 *
 * --- 2. current_period_end ---
 *
 * 2023-10-16: lived on the Subscription object:
 *
 *   stripeTimestampToDate(subscription.current_period_end)
 *
 * Later APIs moved period bounds onto each subscription item — see live create/update
 * above. (Timestamp → Date: stripeTimestampToDate in lib/stripe.ts.)
 *
 * --- 3. Casting event.data.object ---
 *
 * Always narrow by event.type before casting — on every API version:
 *
 *   checkout.session.completed  → Stripe.Checkout.Session
 *   invoice.payment_succeeded   → Stripe.Invoice
 *
 * Do not reuse one cast for all events.
 */
