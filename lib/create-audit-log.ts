import { currentUser } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";

interface Props {
  entityId: string;
  entityType: ENTITY_TYPE;
  entityTitle: string;
  action: ACTION;
}

/**
 * Writes an audit log row for a domain mutation.
 *
 * Failures are swallowed here (`{ error }`, no throw) so Actions can `await`
 * this without a try/catch — a failed log must not fail the mutation or
 * trigger a client retry. Callers ignore the return value.
 */
export const createAuditLog = async ({
  entityId,
  entityType,
  entityTitle,
  action,
}: Props) => {
  try {
    const orgId = (await getOrgAuth())?.orgId;
    const user = await currentUser();

    if (!orgId || !user) {
      throw new Error("User not found!");
    }

    await prisma.auditLog.create({
      data: {
        orgId,
        entityId,
        entityType,
        entityTitle,
        action,
        userId: user.id,
        userImage: user.imageUrl,
        userName: user.firstName + " " + user.lastName,
      },
    });
  } catch (reason) {
    console.log("[AUDIT_LOG_ERROR]", reason);
    return {
      error: "Failed to create audit log",
    };
  }
};
