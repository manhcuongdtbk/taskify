"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CopyListSchema } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { createAuditLog } from "@/lib/create-audit-log";

const handler = async ({ id, boardId }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let list;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const listToCopy = await tx.list.findUnique({
        where: { id, boardId, board: { orgId } },
        include: { cards: true },
      });

      // Return — do not throw — so "List not found" is not swallowed as a copy failure.
      if (!listToCopy) {
        return { copied: false as const };
      }

      const lastList = await tx.list.findFirst({
        where: { boardId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = lastList ? lastList.order + 1 : 1;

      return {
        copied: true as const,
        list: await tx.list.create({
          data: {
            title: listToCopy.title,
            boardId: listToCopy.boardId,
            order: newOrder,
            cards: {
              createMany: {
                data: listToCopy.cards.map((card) => ({
                  title: card.title,
                  description: card.description,
                  order: card.order,
                })),
              },
            },
          },
          include: { cards: true },
        }),
      };
    });

    if (!outcome.copied) {
      return { serverError: "List not found" };
    }

    list = outcome.list;

    await createAuditLog({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.CREATE,
    });
  } catch {
    return { serverError: "Failed to copy." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const copyList = createSafeAction(CopyListSchema, handler);
