"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateCardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

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
    const list = await prisma.list.findUnique({
      where: { id: listId, boardId, board: { orgId } },
    });

    if (!list) {
      return { serverError: "List not found." };
    }

    const lastCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    card = await prisma.card.create({
      data: { title, listId, order: newOrder },
    });

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
