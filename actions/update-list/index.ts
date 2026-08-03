"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateList } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, title, boardId } = data;

  let list;

  try {
    list = await prisma.list.update({
      where: { id, boardId, board: { orgId } },
      data: { title },
    });

    await createAuditLog({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.UPDATE,
    });
  } catch {
    return { error: "Failed to update." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const updateList = createSafeAction(UpdateList, handler);
