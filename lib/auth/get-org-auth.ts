// DAL — Data Access Layer for org-scoped authentication.
// docs/authentication-and-authorization.md

import { auth } from "@clerk/nextjs/server";

import { type OrgAuth } from "./get-org-auth.types";

export const getOrgAuth = async (): Promise<OrgAuth | null> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return null;
  }

  return { userId, orgId };
};
