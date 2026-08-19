"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { UpdateCardOrderSchema } from "./schema";

const handler = async (
  { items, boardId }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
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

      // Sequential awaits: interactive `$transaction` uses one adapter-pg
      // connection. Promise.all on `tx` can overlap queries on that connection.
      const updated = [];
      for (const card of items) {
        updated.push(
          await tx.card.update({
            // Security boundary:
            // We intentionally do not separately pre-validate that each card's
            // current list belongs to the org board. The `where` clause scopes
            // the update to cards on `orgId`'s board, so invalid cards fail the
            // update and we return the generic "Failed to reorder." response.
            where: { id: card.id, list: { boardId, board: { orgId } } },
            data: { order: card.order, listId: card.listId },
          }),
        );
      }

      return updated;
    });
  } catch {
    return { serverError: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: updatedCards };
};

export const updateCardOrder = createSafeAction(UpdateCardOrderSchema, handler);
