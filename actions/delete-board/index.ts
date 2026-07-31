"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { DeleteBoard } from "./schema";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { decrementAvailableCount } from "@/lib/organization-limit";
import { checkSubscription } from "@/lib/subscription";
import { paths } from "@/lib/paths";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const isPro = await checkSubscription();

  const { id } = data;

  let board;

  try {
    board = await prisma.board.delete({
      where: { id, orgId },
    });

    if (!isPro) {
      await decrementAvailableCount();
    }

    await createAuditLog({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(paths.organization(orgId));
  redirect(paths.organization(orgId));
};

export const deleteBoard = createSafeAction(DeleteBoard, handler);
