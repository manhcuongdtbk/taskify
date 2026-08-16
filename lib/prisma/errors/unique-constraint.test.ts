import { describe, expect, test } from "vitest";

import { Prisma } from "@/app/generated/prisma/client";

import { isUniqueConstraintError } from "./unique-constraint";

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "0",
  });

describe("isUniqueConstraintError", () => {
  test("is true for PrismaClientKnownRequestError P2002", () => {
    expect(isUniqueConstraintError(uniqueConstraintError())).toBe(true);
  });

  test("is true when the driver reports P2002 without the Prisma class", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true);
  });

  test("is true when P2002 is nested on cause", () => {
    expect(
      isUniqueConstraintError(
        new Error("driver wrapper", { cause: uniqueConstraintError() }),
      ),
    ).toBe(true);
  });

  test("is false for other Prisma known-request codes", () => {
    expect(
      isUniqueConstraintError(
        new Prisma.PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "0",
        }),
      ),
    ).toBe(false);
  });

  test("is false for a plain Error", () => {
    expect(isUniqueConstraintError(new Error("db down"))).toBe(false);
  });
});
