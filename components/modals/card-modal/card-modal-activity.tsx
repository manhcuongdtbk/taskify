"use client";

import { type AuditLog } from "@/app/generated/prisma/client";
import { ActivityItem } from "@/components/activity-item";
import { SkeletonStatus } from "@/components/skeleton-status";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityIcon } from "lucide-react";

const heading = "Activity";

interface CardModalActivityProps {
  auditLogs: AuditLog[];
}

export const CardModalActivity = ({ auditLogs }: CardModalActivityProps) => {
  return (
    <div className="flex w-full items-start gap-x-3">
      <ActivityIcon className="mt-0.5 h-5 w-5 text-neutral-700" />
      <div className="w-full">
        <p className="mb-2 font-semibold text-neutral-700">{heading}</p>
        <ol className="mt-2 space-y-4">
          {auditLogs.map((auditLog) => (
            <ActivityItem key={auditLog.id} auditLog={auditLog} />
          ))}
        </ol>
      </div>
    </div>
  );
};

CardModalActivity.Skeleton = function ActivitySkeleton() {
  return (
    <SkeletonStatus
      heading={heading}
      className="flex w-full items-start gap-x-3"
    >
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full">
        <Skeleton className="mb-2 h-6 w-24 bg-neutral-200" />
        <Skeleton className="h-10 w-full bg-neutral-200" />
      </div>
    </SkeletonStatus>
  );
};
