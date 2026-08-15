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
  incrementAvailableCount,
} from "@/lib/organization-limit";
import { checkSubscription } from "@/lib/subscription";

const handler = async ({ title, image }: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      serverError: "Unauthorized",
    };
  }

  const isPro = await checkSubscription();

  let board;

  try {
    board = await prisma.$transaction(async (tx) => {
      if (!isPro) {
        const reserved = await incrementAvailableCount(orgId, tx);
        if (!reserved) {
          throw new FreeBoardLimitReachedError();
        }
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

  await createAuditLog({
    entityId: board.id,
    entityType: ENTITY_TYPE.BOARD,
    entityTitle: board.title,
    action: ACTION.CREATE,
  });

  revalidatePath(`/board/${board.id}`);

  return { data: board };
};

export const createBoard = createSafeAction(CreateBoardSchema, handler);
