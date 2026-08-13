import { ActivityItem } from "@/components/activity-item";
import { SkeletonStatus } from "@/components/skeleton-status";
import { Skeleton } from "@/components/ui/skeleton";
import prisma from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { paths } from "@/lib/paths";

export const ActivityList = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    redirect(paths.selectOrg);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      orgId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ol className="mt-4 space-y-4">
      <p className="hidden text-center text-xs text-muted-foreground last:block">
        No activity found inside this organization
      </p>
      {auditLogs.map((auditLog) => (
        <ActivityItem key={auditLog.id} data={auditLog} />
      ))}
    </ol>
  );
};

ActivityList.Skeleton = function ActivityListSkeleton() {
  return (
    <SkeletonStatus heading="activity" className="mt-4 space-y-4">
      <Skeleton className="h-14 w-[80%]" />
      <Skeleton className="h-14 w-[50%]" />
      <Skeleton className="h-14 w-[70%]" />
      <Skeleton className="h-14 w-[80%]" />
      <Skeleton className="h-14 w-[75%]" />
    </SkeletonStatus>
  );
};
