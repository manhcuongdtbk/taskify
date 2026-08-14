"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CopyCardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";

const handler = async ({ id, boardId }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let card;

  try {
    const cardToCopy = await prisma.card.findUnique({
      where: { id, list: { board: { orgId } } },
    });

    if (!cardToCopy) {
      return { serverError: "Card not found" };
    }

    const lastCard = await prisma.card.findFirst({
      where: { listId: cardToCopy.listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    card = await prisma.card.create({
      data: {
        title: `${cardToCopy.title} (Copy)`,
        description: cardToCopy.description,
        order: newOrder,
        listId: cardToCopy.listId,
      },
    });

    await createAuditLog({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.CREATE,
    });
  } catch {
    return { serverError: "Failed to copy." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: card };
};

export const copyCard = createSafeAction(CopyCardSchema, handler);
