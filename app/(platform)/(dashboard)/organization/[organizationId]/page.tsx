import { OrganizationInfo } from "./_components/organization-info";
import { Separator } from "@/components/ui/separator";
import { BoardList } from "./_components/board-list";
import { Suspense } from "react";
import { checkSubscription } from "@/lib/subscription";

export default async function OrganizationIdPage() {
  const isPro = await checkSubscription();

  return (
    <div className="mb-20 w-full">
      <OrganizationInfo isPro={isPro} />
      <Separator className="my-4" />
      <div className="px-2 md:px-4">
        <Suspense fallback={<BoardList.Skeleton />}>
          <BoardList />
        </Suspense>
      </div>
    </div>
  );
}
