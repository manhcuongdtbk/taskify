"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { DeleteList } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;

  let list;

  try {
    list = await prisma.list.delete({
      where: { id, boardId },
    });

    await createAuditLog({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const deleteList = createSafeAction(DeleteList, handler);
