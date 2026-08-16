import { Prisma } from "@/app/generated/prisma/client";

const UNIQUE_CONSTRAINT_ERROR = "P2002";
const UNIQUE_CONSTRAINT_CAUSE_DEPTH = 8;

const isP2002Code = (error: object): boolean =>
  "code" in error && error.code === UNIQUE_CONSTRAINT_ERROR;

/**
 * Unique-constraint failures (`P2002`), including wrappers that nest
 * `PrismaClientKnownRequestError` on `cause`. Official `instanceof` +
 * code check, catch-and-retry races, and what Prisma does not document:
 * docs/prisma.md
 */
export const isUniqueConstraintError = (error: unknown): boolean => {
  let current: unknown = error;

  for (
    let depth = 0;
    current != null && depth < UNIQUE_CONSTRAINT_CAUSE_DEPTH;
    depth += 1
  ) {
    if (
      current instanceof Prisma.PrismaClientKnownRequestError &&
      current.code === UNIQUE_CONSTRAINT_ERROR
    ) {
      return true;
    }

    if (typeof current === "object" && isP2002Code(current)) {
      return true;
    }

    if (typeof current !== "object" || !("cause" in current)) {
      break;
    }

    current = current.cause;
  }

  return false;
};
