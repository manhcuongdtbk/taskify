import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";

const UNIQUE_CONSTRAINT_ERROR = "P2002";

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === UNIQUE_CONSTRAINT_ERROR;

export const FREE_BOARD_LIMIT_SERVER_ERROR =
  "You have reached your limit of free boards. Please upgrade to create more.";

export class FreeBoardLimitReachedError extends Error {
  override name = "FreeBoardLimitReachedError";

  constructor() {
    super(FREE_BOARD_LIMIT_SERVER_ERROR);
  }
}

type OrganizationLimitWriter = {
  organizationLimit: Pick<
    typeof prisma.organizationLimit,
    "updateMany" | "create"
  >;
};

/**
 * Atomically take one Free-plan board slot (`count < maxBoards`, or create
 * `count: 1`). Pass the interactive-transaction client so a failed board
 * create rolls the increment back. docs/prisma.md
 */
export const incrementAvailableCount = async (
  db: OrganizationLimitWriter = prisma,
): Promise<boolean> => {
  const { orgId } = await auth();

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

export const hasAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId,
    },
  });

  if (!organizationLimit || organizationLimit.count < FREE_PLAN.maxBoards) {
    return true;
  }

  return false;
};

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
