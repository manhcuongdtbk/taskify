"use server";

import { auth } from "@clerk/nextjs/server";
import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { DeleteBoardSchema } from "./schema";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { decrementAvailableCount } from "@/lib/board-limits/organization-limit";
import { paths } from "@/lib/paths";

const handler = async ({ id }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let board;

  try {
    board = await prisma.$transaction(async (tx) => {
      const deleted = await tx.board.delete({
        where: { id, orgId },
      });

      // Keep stored counter aligned with reality across plan changes.
      await decrementAvailableCount(orgId, tx);

      return deleted;
    });
  } catch {
    return { serverError: "Failed to delete." };
  }

  // Audit log errors are non-fatal for the domain action. The action must
  // still return success so the client doesn't retry and create duplicates.
  try {
    await createAuditLog({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.DELETE,
    });
  } catch (reason) {
    console.log("[DELETE_BOARD_AUDIT_LOG_ERROR]", reason);
  }

  revalidatePath(paths.organization(orgId));
  redirect(paths.organization(orgId));
};

export const deleteBoard = createSafeAction(DeleteBoardSchema, handler);
