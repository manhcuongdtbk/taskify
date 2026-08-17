"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateListOrderSchema } from "./schema";

const handler = async ({ boardId, items }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let lists;

  try {
    const transaction = items.map((list) =>
      prisma.list.update({
        where: { id: list.id, boardId, board: { orgId } },
        data: { order: list.order },
      }),
    );

    lists = await prisma.$transaction(transaction);
  } catch {
    return { serverError: "Failed to reorder." };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: lists };
};

export const updateListOrder = createSafeAction(UpdateListOrderSchema, handler);
