import { type Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";

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

  const rows = await db.$queryRaw<Array<unknown>>`
    SELECT 1 FROM "OrganizationLimit" WHERE "orgId" = ${orgId} FOR UPDATE
  `;

  if (rows.length === 0) {
    throw new Error("Organization limit row not found");
  }
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

// Runs for both Free and Pro so the count stays accurate across plan changes
// and heals drift from historical Pro creates that skipped the increment.
const syncStoredBoardCount = async (
  orgId: string,
  db: OrganizationLimitWriter,
) => {
  const actual = await countOrgBoards(orgId, db);
  await writeStoredBoardCount(orgId, actual, db);
};

/**
 * Lock the org limit row, run a Board mutation, then sync the stored counter
 * from live COUNT. Used by delete-board so the limit lock is taken before any
 * Board row lock — same order as create-board. docs/prisma.md
 */
export const withOrganizationLimitLock = async <T>(
  orgId: string,
  db: OrganizationLimitWriter,
  mutate: () => Promise<T>,
): Promise<T> => {
  if (!orgId) {
    throw new Error("Unauthorized");
  }

  await lockOrganizationLimitRow(orgId, db);
  const result = await mutate();
  await syncStoredBoardCount(orgId, db);
  return result;
};

/** Stored open-board count used for Free remaining copy. Session org only — same as `checkSubscription`. */
export const getAvailableCount = async () => {
  const orgId = (await getOrgAuth())?.orgId;

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
