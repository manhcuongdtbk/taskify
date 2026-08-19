"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { UpdateBoardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";

const handler = async (
  { id, title }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
  let board;

  try {
    board = await prisma.board.update({
      where: { id, orgId },
      data: { title },
    });

    await createAuditLog({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.UPDATE,
    });
  } catch {
    return { serverError: "Failed to update." };
  }

  revalidatePath(`/board/${id}`);

  return { data: board };
};

export const updateBoard = createSafeAction(UpdateBoardSchema, handler);
