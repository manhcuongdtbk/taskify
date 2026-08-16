import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";
import { checkSubscription } from "@/lib/subscription";

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
 * `P2002` inside that transaction — Postgres would abort it. A failed board
 * create rolls the increment back. docs/prisma.md
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

/** Read-side Free-plan room. Creates still go through `incrementAvailableCount`. */
export const isBelowFreeBoardCap = (count: number) =>
  count < FREE_PLAN.maxBoards;

/** UI gate: Pro, or Free with unused board slots. Creates still go through `incrementAvailableCount`. */
export const canCreateBoard = (isPro: boolean, count: number) =>
  isPro || isBelowFreeBoardCap(count);

/** Request-scoped board-count read. React `cache` — docs/data.md */
export const getAvailableCount = cache(async () => {
  const { orgId } = await auth();

  if (!orgId) {
    return 0;
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId,
    },
  });

  if (!organizationLimit) {
    return 0;
  }

  return organizationLimit.count;
});

/**
 * Create-board UI: remaining copy + trigger gate. Prisma reads are cached on
 * `getAvailableCount` / `checkSubscription` (page `isPro` shares the latter).
 * docs/data.md
 */
export const getBoardCreateAccess = async () => {
  const [availableCount, isPro] = await Promise.all([
    getAvailableCount(),
    checkSubscription(),
  ]);

  return {
    availableCount,
    isPro,
    canCreate: canCreateBoard(isPro, availableCount),
  };
};
