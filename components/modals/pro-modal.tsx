"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProModal } from "@/hooks/use-pro-modal";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { stripeRedirect } from "@/actions/stripe-redirect";
import { toast } from "@/components/ui/toast";
import { PRO_PLAN, formatBoardLimit } from "@/constants/pricing-plans";
import { siteConfig } from "@/config/site";

/**
 * Upgrade upsell UI → actions/stripe-redirect → Stripe URL.
 * Overview: docs/billing.md
 */
export const ProModal = () => {
  const isOpen = useProModal((state) => state.isOpen);
  const handleClose = useProModal((state) => state.close);

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

  const handleClick = () => {
    execute({});
  };

  const boardBenefit = formatBoardLimit(PRO_PLAN.maxBoards);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative flex aspect-video items-center justify-center">
          <Image src="/hero.svg" alt="Hero" fill className="object-cover" />
        </div>
        <div className="mx-auto space-y-6 p-6 text-neutral-700">
          <h2 className="text-xl font-semibold">
            Upgrade to {PRO_PLAN.name} Today!
          </h2>
          <p className="text-xs font-semibold text-neutral-600">
            Explore the best of {siteConfig.name}
          </p>
          <div className="pl-3">
            <ul className="list-disc text-sm">
              <li>{boardBenefit}</li>
              <li>Advanced checklists</li>
              <li>Admin and security features</li>
              <li>And more!</li>
            </ul>
          </div>
          <Button className="w-full" onClick={handleClick} disabled={isLoading}>
            Upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
