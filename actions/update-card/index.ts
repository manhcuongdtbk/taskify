"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateCardSchema } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async ({
  id,
  boardId,
  ...values
}: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let card;

  try {
    card = await prisma.card.update({
      where: { id, list: { board: { orgId } } },
      data: { ...values },
    });

    await createAuditLog({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.UPDATE,
    });
  } catch {
    return { serverError: "Failed to update." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: card };
};

export const updateCard = createSafeAction(UpdateCardSchema, handler);
