import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { isUniqueConstraintError } from "@/lib/prisma/errors/unique-constraint";
import { FREE_PLAN } from "@/constants/pricing-plans";

type OrganizationLimitWriter = {
  organizationLimit: Pick<
    typeof prisma.organizationLimit,
    "updateMany" | "create"
  >;
};

/**
 * Atomically take one Free-plan board slot (`count < maxBoards`, or create
 * `count: 1`). Callers pass `orgId` (already from `auth()`) and the
 * interactive-transaction client so Clerk is not awaited while the row is
 * locked. A failed board create rolls the increment back. docs/prisma.md
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

  try {
    await db.organizationLimit.create({
      data: {
        orgId,
        count: 1,
      },
    });
    return true;
  } catch (reason) {
    if (!isUniqueConstraintError(reason)) {
      throw reason;
    }

    const retried = await db.organizationLimit.updateMany({
      where: whereUnderCap,
      data: increment,
    });
    return retried.count > 0;
  }
};

export const decrementAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  // Floor at 0 without a prior read. Missing rows match 0 updates.
  await prisma.organizationLimit.updateMany({
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

export const getAvailableCount = async () => {
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
};
