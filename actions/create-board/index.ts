"use server";

import prisma from "@/lib/prisma/client";
import { type InputType, type ReturnType } from "./types";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { CreateBoardSchema } from "./schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { FREE_BOARD_LIMIT_SERVER_ERROR } from "@/lib/board-limits/free-board-limit";
import { withOrganizationLimitLock } from "@/lib/board-limits/organization-limit";
import { isProOrganization } from "@/lib/subscription";
import { FREE_PLAN } from "@/constants/pricing-plans";

const handler = async (
  { title, image }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
  let board;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const isPro = await isProOrganization(orgId, tx);

      const createBoardUnderFreeCap = async () => {
        if (!isPro) {
          const actual = await tx.board.count({ where: { orgId } });
          if (actual >= FREE_PLAN.maxBoards) {
            // Return — do not throw — so the at-cap stored-count heal commits.
            return { created: false as const };
          }
        }

        return {
          created: true as const,
          board: await tx.board.create({
            data: {
              title,
              orgId,
              imageId: image.id,
              imageThumbUrl: image.thumbUrl,
              imageFullUrl: image.fullUrl,
              imageLinkHTML: image.linkHTML,
              imageUserName: image.userName,
            },
          }),
        };
      };

      return withOrganizationLimitLock(orgId, tx, createBoardUnderFreeCap);
    });

    if (!outcome.created) {
      return {
        serverError: FREE_BOARD_LIMIT_SERVER_ERROR,
      };
    }

    board = outcome.board;
  } catch (reason) {
    // Defensive mapping: lock helpers can throw `Error("Unauthorized")`
    // when invariants are violated (e.g. empty `orgId`). createSafeAction
    // normally prevents this; this catch keeps the client-facing copy stable.
    if (reason instanceof Error && reason.message === "Unauthorized") {
      return {
        serverError: "Unauthorized",
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
