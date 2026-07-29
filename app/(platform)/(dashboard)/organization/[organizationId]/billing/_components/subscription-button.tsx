"use client";

import { stripeRedirect } from "@/actions/stripe-redirect";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { useProModal } from "@/hooks/use-pro-modal";
import { toast } from "@/components/ui/toast";

interface SubscriptionButtonProps {
  isPro: boolean;
}

/**
 * Billing CTA: Free → Pro modal (Checkout); Pro → stripeRedirect
 * (Customer Portal via billingPortal.sessions — same product).
 *
 * `isPro` here is feature access (checkSubscription), not the same as
 * “has stripeCustomerId” inside stripe-redirect — see docs/stripe.md Gotchas.
 */
export function SubscriptionButton({ isPro }: SubscriptionButtonProps) {
  const proModal = useProModal();

  const { execute, isLoading } = useAction(stripeRedirect, {
    onSuccess: (data) => {
      window.location.href = data;
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: error,
      });
    },
  });

  const onClick = () => {
    if (isPro) {
      execute({});
    } else {
      proModal.onOpen();
    }
  };

  return (
    <Button disabled={isLoading} onClick={onClick}>
      {isPro ? "Manage Subscription" : "Upgrade to Pro"}
    </Button>
  );
}
