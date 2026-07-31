import { Separator } from "@/components/ui/separator";
import { OrganizationInfo } from "../_components/organization-info";
import { Suspense } from "react";
import { ActivityList } from "../_components/activity-list";
import { checkSubscription } from "@/lib/subscription";

export default async function OrganizationActivityPage({}: PageProps<"/organization/[organizationId]/activity">) {
  const isPro = await checkSubscription();

  return (
    <div className="w-full">
      <OrganizationInfo isPro={isPro} />
      <Separator className="my-2" />
      <Suspense fallback={<ActivityList.Skeleton />}>
        <ActivityList />
      </Suspense>
    </div>
  );
}
