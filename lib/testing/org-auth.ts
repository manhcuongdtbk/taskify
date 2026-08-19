import { type OrgAuth } from "@/lib/auth/get-org-auth.types";

/**
 * Shared org session payload for tests.
 *
 * Many suites mock `getOrgAuth()` to return the same `{ orgId, userId }`
 * values. Typed as `OrgAuth` so tests can use it with
 * `vi.mocked(getOrgAuth).mockResolvedValue(orgAuth)` without extra casts.
 */
export const orgAuth: OrgAuth = {
  orgId: "org_1",
  userId: "user_1",
};
