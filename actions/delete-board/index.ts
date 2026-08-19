"use server";

import { type InputType, type ReturnType } from "./types";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { type OrgAuth } from "@/lib/auth/get-org-auth.types";
import { DeleteBoardSchema } from "./schema";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/enums";
import { withOrganizationLimitLock } from "@/lib/board-limits/organization-limit";
import { paths } from "@/lib/paths";

const handler = async (
  { id }: InputType,
  { orgId }: OrgAuth,
): Promise<ReturnType> => {
  let board;

  try {
    board = await prisma.$transaction(async (tx) => {
      const deleteBoardInOrg = () => tx.board.delete({ where: { id, orgId } });

      return withOrganizationLimitLock(orgId, tx, deleteBoardInOrg);
    });
  } catch {
    return { serverError: "Failed to delete." };
  }

  await createAuditLog({
    entityId: board.id,
    entityType: ENTITY_TYPE.BOARD,
    entityTitle: board.title,
    action: ACTION.DELETE,
  });

  revalidatePath(paths.organization(orgId));
  redirect(paths.organization(orgId));
};

export const deleteBoard = createSafeAction(DeleteBoardSchema, handler);
