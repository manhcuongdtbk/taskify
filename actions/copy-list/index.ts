"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CopyList } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;

  let list;

  try {
    const listToCopy = await prisma.list.findUnique({
      where: { id, boardId, board: { orgId } },
      include: { cards: true },
    });

    if (!listToCopy) {
      return { error: "List not found" };
    }

    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastList ? lastList.order + 1 : 1;

    list = await prisma.list.create({
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
    });
  } catch (error) {
    return { error: "Failed to copy." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const copyList = createSafeAction(CopyList, handler);
