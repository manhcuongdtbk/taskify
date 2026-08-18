"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateCardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { lockListRowForUpdate } from "@/lib/prisma/lock-for-update";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";

const handler = async ({
  boardId,
  title,
  listId,
}: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let card;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const list = await tx.list.findUnique({
        where: { id: listId, boardId, board: { orgId } },
      });

      // Return — do not throw — so "List not found." is not swallowed as a create failure.
      if (!list) {
        return { created: false as const };
      }

      const locked = await lockListRowForUpdate(listId, tx);
      if (!locked) {
        return { created: false as const };
      }

      const lastCard = await tx.card.findFirst({
        where: { listId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = lastCard ? lastCard.order + 1 : 1;

      return {
        created: true as const,
        card: await tx.card.create({
          data: { title, listId, order: newOrder },
        }),
      };
    });

    if (!outcome.created) {
      return { serverError: "List not found." };
    }

    card = outcome.card;

    await createAuditLog({
      entityId: card.id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.CREATE,
    });
  } catch {
    return { serverError: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: card };
};

export const createCard = createSafeAction(CreateCardSchema, handler);
