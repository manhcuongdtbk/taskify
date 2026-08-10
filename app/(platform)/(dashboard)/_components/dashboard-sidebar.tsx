// TODO: consider migrating to https://ui.shadcn.com/docs/components/base/sidebar for desktop sidebar

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import { SkeletonStatus } from "@/components/skeleton-status";
import { siteLocalStorageKeys } from "@/config/site";
import { paths } from "@/lib/paths";
import { NavItem } from "./nav-item";

const workspacesHeading = "Workspaces";

interface DashboardSidebarProps {
  storageKey?: string;
}

export const DashboardSidebar = ({
  storageKey = siteLocalStorageKeys.sidebarExpanded,
}: DashboardSidebarProps) => {
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>(
    storageKey,
    {},
  );

  const { organization: activeOrganization, isLoaded: isLoadedOrganization } =
    useOrganization();

  const { userMemberships, isLoaded: isLoadedOrganizationList } =
    useOrganizationList({ userMemberships: { infinite: true } });

  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key);
      }
      return acc;
    },
    [],
  );

  const handleExpand = (id: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [id]: !expanded[id],
    }));
  };

  if (
    !isLoadedOrganization ||
    !isLoadedOrganizationList ||
    userMemberships.isLoading
  ) {
    return <DashboardSidebar.Skeleton />;
  }

  return (
    <>
      <div className="mb-1 flex items-center text-xs font-medium">
        <span className="pl-4">{workspacesHeading}</span>
        <Link
          href={paths.selectOrg}
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className: "ml-auto",
          })}
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <Accordion
        multiple
        defaultValue={defaultAccordionValue}
        className="space-y-2"
      >
        {userMemberships.data.map(({ organization }) => (
          <NavItem
            key={organization.id}
            isActive={activeOrganization?.id === organization.id}
            isExpanded={expanded[organization.id]}
            organization={organization}
            onExpand={handleExpand}
          />
        ))}
      </Accordion>
    </>
  );
};

// Section skeleton: one SkeletonStatus for the workspaces list. NavItem.SkeletonItem
// is a bare row — docs/conventions.md (section vs item skeletons).
DashboardSidebar.Skeleton = function DashboardSidebarSkeleton() {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-10 w-[50%]" />
        <Skeleton className="h-10 w-10" />
      </div>
      <SkeletonStatus heading={workspacesHeading} className="space-y-2">
        <NavItem.SkeletonItem />
        <NavItem.SkeletonItem />
        <NavItem.SkeletonItem />
      </SkeletonStatus>
    </>
  );
};
