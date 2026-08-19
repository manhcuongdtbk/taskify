import { auth } from "@clerk/nextjs/server";

/**
 * Shared org auth payload for action tests.
 *
 * Many action suites mock Clerk `auth()` to return the same `{ orgId, userId }`
 * values. We type it as *Clerk's exact* `auth()` return type so tests can use it
 * with `vi.mocked(auth).mockResolvedValue(...)` without extra casts.
 */
export const orgAuth = {
  orgId: "org_1",
  userId: "user_1",
} as Awaited<ReturnType<typeof auth>>;
