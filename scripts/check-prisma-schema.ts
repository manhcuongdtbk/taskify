/**
 * Prisma schema gate — format owned by `prisma format` (not Prettier).
 *
 *   pnpm lint:prisma          # validate + fail if unformatted (does not write schema.prisma)
 *   pnpm lint:prisma:fix     # prisma format
 *
 * Check path: Prisma has no `format --check`. Format a temp copy and compare,
 * same contract as `prettier --check`. Docs: docs/conventions.md § Lint & format
 * · docs/prisma.md
 */
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const schemaPath = resolve("prisma/schema.prisma");
const fix = process.argv.includes("--fix");

const runPrisma = (args: string[], quiet = false) => {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (quiet) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    process.exit(result.status ?? 1);
  }
};

if (fix) {
  runPrisma(["format"]);
  process.exit(0);
}

runPrisma(["validate"]);

const dir = mkdtempSync(join(tmpdir(), "prisma-format-check-"));
const copyPath = join(dir, "schema.prisma");

try {
  copyFileSync(schemaPath, copyPath);
  runPrisma(["format", `--schema=${copyPath}`], true);

  if (!readFileSync(schemaPath).equals(readFileSync(copyPath))) {
    console.error(
      "prisma/schema.prisma is not formatted. Run: pnpm lint:prisma:fix",
    );
    process.exit(1);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
