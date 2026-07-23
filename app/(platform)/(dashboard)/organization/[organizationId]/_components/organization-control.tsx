// TODO: is there a better and newer way to do this? Refer https://clerk.com/changelog/2024-08-02-set-active-by-slug

"use client";

import { useParams } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";
import { useEffect } from "react";

export default function OrganizationControl() {
  const params = useParams();

  const { setActive } = useOrganizationList();

  useEffect(() => {
    if (!setActive) return;

    setActive({ organization: params.organizationId as string });
  }, [setActive, params.organizationId]);

  return null;
}
