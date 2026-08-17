"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateCardOrderSchema } from "./schema";

const handler = async ({ items, boardId }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let updatedCards;

  try {
    const destinationListIds = [...new Set(items.map((card) => card.listId))];

    if (destinationListIds.length > 0) {
      const destinationCount = await prisma.list.count({
        where: {
          id: { in: destinationListIds },
          boardId,
          board: { orgId },
        },
      });

      if (destinationCount !== destinationListIds.length) {
        return { serverError: "Failed to reorder." };
      }
    }

    const transaction = items.map((card) =>
      prisma.card.update({
        where: { id: card.id, list: { boardId, board: { orgId } } },
        data: { order: card.order, listId: card.listId },
      }),
    );

    updatedCards = await prisma.$transaction(transaction);
  } catch {
    return { serverError: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: updatedCards };
};

export const updateCardOrder = createSafeAction(UpdateCardOrderSchema, handler);
