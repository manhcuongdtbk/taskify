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
    updatedCards = await prisma.$transaction(async (tx) => {
      const destinationListIds = [...new Set(items.map((card) => card.listId))];

      if (destinationListIds.length > 0) {
        const destinationCount = await tx.list.count({
          where: {
            id: { in: destinationListIds },
            boardId,
            board: { orgId },
          },
        });

        if (destinationCount !== destinationListIds.length) {
          throw new Error("Failed to reorder.");
        }
      }

      const updates = items.map((card) =>
        tx.card.update({
          // Security boundary:
          // We intentionally do not separately pre-validate that each card's
          // current list belongs to the org board. The `where` clause scopes
          // the update to cards on `orgId`'s board, so invalid cards fail the
          // update and we return the generic "Failed to reorder." response.
          where: { id: card.id, list: { boardId, board: { orgId } } },
          data: { order: card.order, listId: card.listId },
        }),
      );

      return Promise.all(updates);
    });
  } catch (reason) {
    console.log("[UPDATE_CARD_ORDER_ERROR]", reason);
    return { serverError: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: updatedCards };
};

export const updateCardOrder = createSafeAction(UpdateCardOrderSchema, handler);
