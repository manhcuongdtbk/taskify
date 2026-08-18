import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";

type OrganizationLimitWriter = {
  organizationLimit: Pick<
    typeof prisma.organizationLimit,
    "updateMany" | "createMany"
  >;
};

/**
 * Atomically take one Free-plan board slot (`count < maxBoards`, or insert
 * `count: 1` with `createMany` `skipDuplicates`). Callers pass `orgId`
 * (already from `auth()`) and the interactive-transaction client so Clerk is
 * not awaited while the row is locked. A unique collision must not throw
 * `P2002` inside that transaction. We rely on Prisma `skipDuplicates`
 * (`ON CONFLICT DO NOTHING`) for the `createMany` step so the unique
 * constraint can’t abort the interactive transaction. A failed board create
 * leaves the counter unchanged; the caller treats the reservation result as
 * authoritative. docs/prisma.md
 */
export const incrementAvailableCount = async (
  orgId: string,
  db: OrganizationLimitWriter = prisma,
): Promise<boolean> => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const whereUnderCap = {
    orgId,
    count: {
      lt: FREE_PLAN.maxBoards,
    },
  };
  const increment = {
    count: {
      increment: 1 as const,
    },
  };

  const updated = await db.organizationLimit.updateMany({
    where: whereUnderCap,
    data: increment,
  });

  if (updated.count > 0) {
    return true;
  }

  const inserted = await db.organizationLimit.createMany({
    data: {
      orgId,
      count: 1,
    },
    skipDuplicates: true,
  });

  if (inserted.count > 0) {
    return true;
  }

  const retried = await db.organizationLimit.updateMany({
    where: whereUnderCap,
    data: increment,
  });
  return retried.count > 0;
};

/**
 * Atomically increment the stored open-board counter (for Pro + for Free).
 *
 * Why we keep this separate from `incrementAvailableCount`:
 * - `incrementAvailableCount` enforces the Free-plan cap (`count < maxBoards`)
 *   and returns `false` at the cap.
 * - `incrementBoardCount` always increments so the stored counter stays aligned
 *   with reality across plan upgrades/downgrades.
 *
 * Concurrency approach (safe for interactive tx):
 * 1) Ensure the org row exists with `count: 0` (via `createMany` + `skipDuplicates`)
 * 2) Increment with `updateMany`
 */
export const incrementBoardCount = async (
  orgId: string,
  db: OrganizationLimitWriter = prisma,
) => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  await db.organizationLimit.createMany({
    data: {
      orgId,
      // Create with 0 so concurrent callers each only contribute +1 via updateMany.
      count: 0,
    },
    skipDuplicates: true,
  });

  await db.organizationLimit.updateMany({
    where: { orgId },
    data: {
      count: {
        increment: 1 as const,
      },
    },
  });
};

/**
 * Free one Free-plan board slot (`count > 0`). Callers pass `orgId` (already
 * from `auth()`) and the interactive-transaction client so Clerk is not
 * awaited while the row is locked. A failed board delete rolls the decrement
 * back. docs/prisma.md
 */
export const decrementAvailableCount = async (
  orgId: string,
  db: OrganizationLimitWriter = prisma,
) => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  // Floor at 0 without a prior read. Missing rows match 0 updates.
  await db.organizationLimit.updateMany({
    where: {
      orgId,
      count: {
        gt: 0,
      },
    },
    data: {
      count: {
        decrement: 1,
      },
    },
  });
};

/** Stored open-board count used for Free remaining copy. */
export const getAvailableCount = async (orgId?: string | null) => {
  const resolvedOrgId = orgId ?? (await auth()).orgId;

  if (!resolvedOrgId) {
    return 0;
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId: resolvedOrgId,
    },
  });

  if (!organizationLimit) {
    return 0;
  }

  return organizationLimit.count;
};
