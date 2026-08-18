"use server";

import prisma from "@/lib/prisma/client";
import { type InputType, type ReturnType } from "./types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateBoardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import {
  FREE_BOARD_LIMIT_SERVER_ERROR,
  FreeBoardLimitReachedError,
} from "@/lib/errors/free-board-limit";
import {
  incrementAvailableCount,
  incrementBoardCount,
} from "@/lib/board-limits/organization-limit";
import { isProOrganization } from "@/lib/subscription";

const handler = async ({ title, image }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  let board;

  try {
    board = await prisma.$transaction(async (tx) => {
      const isPro = await isProOrganization(orgId, tx);
      if (isPro) {
        // Keep the stored counter aligned with reality across plan changes.
        await incrementBoardCount(orgId, tx);
      } else {
        const reserved = await incrementAvailableCount(orgId, tx);
        if (!reserved) throw new FreeBoardLimitReachedError();
      }

      return tx.board.create({
        data: {
          title,
          orgId,
          imageId: image.id,
          imageThumbUrl: image.thumbUrl,
          imageFullUrl: image.fullUrl,
          imageLinkHTML: image.linkHTML,
          imageUserName: image.userName,
        },
      });
    });
  } catch (reason) {
    if (reason instanceof Error && reason.message === "Unauthorized") {
      return {
        serverError: "Unauthorized",
      };
    }

    if (
      reason instanceof FreeBoardLimitReachedError ||
      (reason instanceof Error &&
        reason.message === FREE_BOARD_LIMIT_SERVER_ERROR)
    ) {
      return {
        serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
      };
    }

    return {
      serverError: "Failed to create.",
    };
  }

  try {
    await createAuditLog({
      entityId: board.id,
      entityType: ENTITY_TYPE.BOARD,
      entityTitle: board.title,
      action: ACTION.CREATE,
    });
  } catch (reason) {
    // Audit log errors are non-fatal for the domain action. The action must
    // still return success so the client doesn't retry and create duplicates.
    console.log("[CREATE_BOARD_AUDIT_LOG_ERROR]", reason);
  }

  revalidatePath(`/board/${board.id}`);

  return { data: board };
};

export const createBoard = createSafeAction(CreateBoardSchema, handler);
