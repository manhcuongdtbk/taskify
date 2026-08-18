"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateListSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";

const handler = async ({ boardId, title }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let list;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId, orgId },
      });

      // Return — do not throw — so "Board not found." is not swallowed as a create failure.
      if (!board) {
        return { created: false as const };
      }

      const lastList = await tx.list.findFirst({
        where: { boardId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = lastList ? lastList.order + 1 : 1;

      return {
        created: true as const,
        list: await tx.list.create({
          data: { title, boardId, order: newOrder },
        }),
      };
    });

    if (!outcome.created) {
      return { serverError: "Board not found." };
    }

    list = outcome.list;

    await createAuditLog({
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      entityTitle: list.title,
      action: ACTION.CREATE,
    });
  } catch {
    return { serverError: "Failed to create." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const createList = createSafeAction(CreateListSchema, handler);
