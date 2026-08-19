import { type Prisma } from "@/app/generated/prisma/client";

/**
 * Methods used under `prisma.$transaction(async (tx) => …)`. `$connect?: never`
 * rejects the global Client — Prisma 7 still puts `$transaction` on `tx`
 * (nested transactions), so that key cannot tell them apart. `FOR UPDATE` is
 * released at statement end outside a transaction. docs/prisma.md
 */
type RowLockWriter = {
  $queryRaw: Prisma.TransactionClient["$queryRaw"];
  $connect?: never;
};

/**
 * Serialize next-list-order writes on one board. Callers pass `boardId` from an
 * org-scoped lookup and the interactive-transaction client (`tx`). Returns
 * `false` when the row is gone so Actions can surface “not found” instead of a
 * create/copy failure. docs/prisma.md
 */
export const lockBoardRowForUpdate = async (
  boardId: string,
  db: RowLockWriter,
) => {
  const rows = await db.$queryRaw<Array<unknown>>`
    SELECT 1 FROM "Board" WHERE "id" = ${boardId} FOR UPDATE
  `;

  return rows.length > 0;
};

/**
 * Serialize next-card-order writes on one list. Callers pass `listId` from an
 * org-scoped lookup and the interactive-transaction client (`tx`). Returns
 * `false` when the row is gone so Actions can surface “not found” instead of a
 * create/copy failure. docs/prisma.md
 */
export const lockListRowForUpdate = async (
  listId: string,
  db: RowLockWriter,
) => {
  const rows = await db.$queryRaw<Array<unknown>>`
    SELECT 1 FROM "List" WHERE "id" = ${listId} FOR UPDATE
  `;

  return rows.length > 0;
};
