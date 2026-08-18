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
    const outcome = await prisma.$transaction(async (tx) => {
      const cardToCopy = await tx.card.findUnique({
        where: { id, list: { boardId, board: { orgId } } },
      });

      // Return — do not throw — so "Card not found" is not swallowed as a copy failure.
      if (!cardToCopy) {
        return { copied: false as const };
      }

      const lastCard = await tx.card.findFirst({
        where: { listId: cardToCopy.listId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = lastCard ? lastCard.order + 1 : 1;

      return {
        copied: true as const,
        card: await tx.card.create({
          data: {
            title: `${cardToCopy.title} (Copy)`,
            description: cardToCopy.description,
            order: newOrder,
            listId: cardToCopy.listId,
          },
        }),
      };
    });

    if (!outcome.copied) {
      return { serverError: "Card not found" };
    }

    card = outcome.card;

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
