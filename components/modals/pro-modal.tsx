"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProModal } from "@/hooks/use-pro-modal";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { stripeRedirect } from "@/actions/stripe-redirect";
import { toast } from "@/components/ui/toast";

/**
 * Upgrade upsell UI → actions/stripe-redirect → Stripe URL.
 * Overview: docs/stripe.md
 */
export const ProModal = () => {
  const proModal = useProModal();

  const { execute, isLoading } = useAction(stripeRedirect, {
    onSuccess: (data) => {
      // TODO: read Next.js doc about redirecting to external URLs
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
    execute({});
  };

  return (
    <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative flex aspect-video items-center justify-center">
          <Image src="/hero.svg" alt="Hero" fill className="object-cover" />
        </div>
        <div className="mx-auto space-y-6 p-6 text-neutral-700">
          <h2 className="text-xl font-semibold">
            Upgrade to Taskify Pro Today!
          </h2>
          <p className="text-xs font-semibold text-neutral-600">
            Explore the best of Taskify
          </p>
          <div className="pl-3">
            <ul className="list-disc text-sm">
              <li>Unlimited boards</li>
              <li>Advanced checklists</li>
              <li>Admin and security features</li>
              <li>And more!</li>
            </ul>
          </div>
          <Button className="w-full" onClick={onClick} disabled={isLoading}>
            Upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
