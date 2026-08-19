"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { DeleteCardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";

const handler = async (
  { id, boardId }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
  let card;

  try {
    card = await prisma.card.delete({
      where: { id, list: { boardId, board: { orgId } } },
    });

    await createAuditLog({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.DELETE,
    });
  } catch {
    return { serverError: "Failed to delete." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: card };
};

export const deleteCard = createSafeAction(DeleteCardSchema, handler);
