"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { UpdateListSchema } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async (
  { id, title, boardId }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
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
    return { serverError: "Failed to update." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const updateList = createSafeAction(UpdateListSchema, handler);
