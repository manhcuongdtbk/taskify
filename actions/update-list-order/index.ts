"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateListOrder } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { boardId, items } = data;

  let lists;

  try {
    const transaction = items.map((list) =>
      prisma.list.update({
        where: { id: list.id, board: { orgId } },
        data: { order: list.order },
      }),
    );

    lists = await prisma.$transaction(transaction);
  } catch (error) {
    return { error: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: lists };
};

export const updateListOrder = createSafeAction(UpdateListOrder, handler);
