import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { FREE_PLAN } from "@/constants/plans";

export const incrementAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId,
    },
  });

  if (organizationLimit) {
    await prisma.organizationLimit.update({
      where: {
        orgId,
      },
      data: {
        count: organizationLimit.count + 1,
      },
    });
  } else {
    await prisma.organizationLimit.create({
      data: {
        orgId,
        count: 1,
      },
    });
  }
};

export const decrementAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId,
    },
  });

  if (organizationLimit) {
    await prisma.organizationLimit.update({
      where: {
        orgId,
      },
      data: {
        count: organizationLimit.count > 0 ? organizationLimit.count - 1 : 0,
      },
    });
  } else {
    await prisma.organizationLimit.create({
      data: {
        orgId,
        count: 1,
      },
    });
  }
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
