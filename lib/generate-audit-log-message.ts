// TODO: fix all prisma imports
import { ACTION, type AuditLog } from "@/app/generated/prisma/browser";

export const generateAuditLogMessage = (auditLog: AuditLog) => {
  const { action, entityTitle, entityType } = auditLog;

  switch (action) {
    case ACTION.CREATE:
      return `created ${entityType.toLowerCase()} "${entityTitle}"`;
    case ACTION.UPDATE:
      return `updated ${entityType.toLowerCase()} "${entityTitle}"`;
    case ACTION.DELETE:
      return `deleted ${entityType.toLowerCase()} "${entityTitle}"`;
    default:
      return `unknown action ${entityType.toLowerCase()} "${entityTitle}"`;
  }
};
