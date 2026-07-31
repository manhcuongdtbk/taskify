"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { FREE_PLAN, PRO_PLAN } from "@/constants/pricing-plans";
import { useOrganization } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import Image from "next/image";

interface OrganizationInfoProps {
  isPro: boolean;
}

export const OrganizationInfo = ({ isPro }: OrganizationInfoProps) => {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return <OrganizationInfo.Skeleton />;
  }

  return (
    <div className="flex items-center gap-x-4">
      <div className="relative h-15 w-15">
        {organization?.imageUrl ? (
          <Image
            fill
            src={organization?.imageUrl}
            alt={organization?.name || "Organization"}
            className="rounded-md object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="text-xl font-semibold">{organization?.name}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <CreditCard className="mr-1 h-3 w-3" />
          {isPro ? PRO_PLAN.name : FREE_PLAN.name}
        </div>
      </div>
    </div>
  );
};

OrganizationInfo.Skeleton = function InfoSkeleton() {
  return (
    <div className="flex items-center gap-x-4">
      <div className="relative h-15 w-15">
        <Skeleton className="absolute h-full w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-50" />
        <div className="flex items-center">
          <Skeleton className="mr-2 h-4 w-4" />
          <Skeleton className="h-4 w-25" />
        </div>
      </div>
    </div>
  );
};
