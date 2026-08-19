"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { UpdateListOrderSchema } from "./schema";

const handler = async (
  { boardId, items }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
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
