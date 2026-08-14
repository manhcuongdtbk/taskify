import * as z from "zod";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";
import { JsonIsoDateTimeSchema } from "@/lib/json-iso-date-time";

export const CardWithListTitleJsonSchema = z.object({
  id: z.string().trim(),
  title: z.string().trim(),
  order: z.int(),
  description: z.string().trim().nullable(),
  listId: z.string().trim(),
  createdAt: JsonIsoDateTimeSchema,
  updatedAt: JsonIsoDateTimeSchema,
  list: z.object({
    title: z.string().trim(),
  }),
});

const AuditLogJsonSchema = z.object({
  id: z.string().trim(),
  orgId: z.string().trim(),
  action: z.enum(ACTION),
  entityId: z.string().trim(),
  entityType: z.enum(ENTITY_TYPE),
  entityTitle: z.string().trim(),
  userId: z.string().trim(),
  userImage: z.string().trim(),
  userName: z.string().trim(),
  createdAt: JsonIsoDateTimeSchema,
  updatedAt: JsonIsoDateTimeSchema,
});

export const CardAuditLogsJsonSchema = z.array(AuditLogJsonSchema);
