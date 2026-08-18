import { auth } from "@clerk/nextjs/server";
import { type Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { FREE_PLAN } from "@/constants/pricing-plans";

/**
 * Methods used under `prisma.$transaction(async (tx) => …)`. `$connect?: never`
 * rejects the global Client — Prisma 7 still puts `$transaction` on `tx`
 * (nested transactions), so that key cannot tell them apart. `FOR UPDATE` is
 * released at statement end outside a transaction. docs/prisma.md
 */
type OrganizationLimitWriter = {
  $queryRaw: Prisma.TransactionClient["$queryRaw"];
  board: Pick<Prisma.TransactionClient["board"], "count">;
  organizationLimit: Pick<
    Prisma.TransactionClient["organizationLimit"],
    "updateMany" | "createMany"
  >;
  $connect?: never;
};

/**
 * Serialize board-count writes for one org: ensure the limit row exists, then
 * `SELECT … FOR UPDATE` so concurrent creates/deletes wait. Cap checks use
 * `COUNT(Board)` under that lock — not the stored counter — so a stale row
 * (historical Pro creates that did not increment) cannot bypass the Free cap.
 * `skipDuplicates` keeps a unique collision from aborting the interactive
 * transaction. docs/prisma.md
 */
const lockOrganizationLimitRow = async (
  orgId: string,
  db: OrganizationLimitWriter,
) => {
  await db.organizationLimit.createMany({
    data: {
      orgId,
      count: 0,
    },
    skipDuplicates: true,
  });

  await db.$queryRaw`
    SELECT 1 FROM "OrganizationLimit" WHERE "orgId" = ${orgId} FOR UPDATE
  `;
};

const countOrgBoards = (orgId: string, db: OrganizationLimitWriter) =>
  db.board.count({ where: { orgId } });

const writeStoredBoardCount = (
  orgId: string,
  count: number,
  db: OrganizationLimitWriter,
) =>
  db.organizationLimit.updateMany({
    where: { orgId },
    data: { count },
  });

/**
 * Atomically take one Free-plan board slot. Locks the org row, counts live
 * boards, and writes `actual + 1` when under the cap. Callers pass `orgId`
 * (already from `auth()`) and the interactive-transaction client (`tx`) so
 * Clerk is not awaited while the row is locked. `FOR UPDATE` is released at
 * statement end outside a transaction. A failed board create rolls the write
 * back. docs/prisma.md
 */
export const incrementAvailableCount = async (
  orgId: string,
  db: OrganizationLimitWriter,
): Promise<boolean> => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  await lockOrganizationLimitRow(orgId, db);
  const actual = await countOrgBoards(orgId, db);

  if (actual >= FREE_PLAN.maxBoards) {
    await writeStoredBoardCount(orgId, actual, db);
    return false;
  }

  await writeStoredBoardCount(orgId, actual + 1, db);
  return true;
};

/**
 * Atomically increment the stored open-board counter for Pro creates.
 *
 * Why we keep this separate from `incrementAvailableCount`:
 * - `incrementAvailableCount` enforces the Free-plan cap (`COUNT(boards) >= maxBoards`)
 *   and returns `false` at the cap.
 * - `incrementBoardCount` always writes `COUNT(boards) + 1` so the stored
 *   counter stays aligned with reality across plan upgrades/downgrades.
 *
 * Callers pass `orgId` (already from `auth()`) and the interactive-transaction
 * client (`tx`) so Clerk is not awaited while the row is locked. `FOR UPDATE`
 * is released at statement end outside a transaction. A failed board create
 * rolls the write back. docs/prisma.md
 */
export const incrementBoardCount = async (
  orgId: string,
  db: OrganizationLimitWriter,
) => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  await lockOrganizationLimitRow(orgId, db);
  const actual = await countOrgBoards(orgId, db);
  await writeStoredBoardCount(orgId, actual + 1, db);
};

/**
 * Align the stored count with remaining boards after a delete. Callers pass
 * `orgId` (already from `auth()`) and the interactive-transaction client (`tx`)
 * so Clerk is not awaited while the row is locked. `FOR UPDATE` is released at
 * statement end outside a transaction. A failed board delete rolls the write
 * back. docs/prisma.md
 */
export const decrementAvailableCount = async (
  orgId: string,
  db: OrganizationLimitWriter,
) => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  await lockOrganizationLimitRow(orgId, db);
  const actual = await countOrgBoards(orgId, db);
  await writeStoredBoardCount(orgId, actual, db);
};

/** Stored open-board count used for Free remaining copy. Session org only — same as `checkSubscription`. */
export const getAvailableCount = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    return 0;
  }

  const organizationLimit = await prisma.organizationLimit.findUnique({
    where: {
      orgId,
    },
  });

  if (!organizationLimit) {
    return 0;
  }

  return organizationLimit.count;
};
