/**
 * Prisma schema gate — format owned by `prisma format` (not Prettier).
 *
 *   pnpm lint:prisma          # validate + fail if unformatted (non-mutating)
 *   pnpm lint:prisma:fix     # prisma format
 *
 * Docs: docs/conventions.md § Lint & format: one contract · docs/prisma.md
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const fix = process.argv.includes("--fix");

const runPrisma = (args: string[]) => {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (fix) {
  runPrisma(["format"]);
  process.exit(0);
}

// Check: validate, then ensure format is a no-op (Prisma has no `format --check`).
runPrisma(["validate"]);

const before = readFileSync(schemaPath);
runPrisma(["format"]);
const after = readFileSync(schemaPath);

if (!before.equals(after)) {
  writeFileSync(schemaPath, before);
  console.error(
    "prisma/schema.prisma is not formatted. Run: pnpm lint:prisma:fix",
  );
  process.exit(1);
}
