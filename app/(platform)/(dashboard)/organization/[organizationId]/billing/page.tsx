import { checkSubscription } from "@/lib/subscription";
import { OrganizationInfo } from "../_components/organization-info";
import { Separator } from "@/components/ui/separator";
import { SubscriptionButton } from "./_components/subscription-button";

export default async function OrganizationBillingPage({}: PageProps<"/organization/[organizationId]/billing">) {
  const isPro = await checkSubscription();

  return (
    <div className="w-full">
      <OrganizationInfo isPro={isPro} />
      <Separator className="my-2" />
      <SubscriptionButton isPro={isPro} />
    </div>
  );
}
