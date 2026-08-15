import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";

export const incrementAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  // Atomic create-or-increment — Prisma `upsert` + `increment`. A read of
  // `count` then `count + 1` lost concurrent board creates.
  await prisma.organizationLimit.upsert({
    where: {
      orgId,
    },
    create: {
      orgId,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });
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
