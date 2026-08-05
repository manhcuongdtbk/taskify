/**
 * Run Vitest coverage for one colocated source ↔ `*.test.*` pair.
 *
 *   pnpm test:coverage:file constants/pricing-plans.ts
 *   pnpm test:coverage:file constants/pricing-plans.test.ts
 *
 * Docs: docs/testing.md (Run)
 */
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

/** Match Vitest include `*.test.?(c|m)[jt]s?(x)` for common TS/JS extensions. */
const TEST_FILE = /^(.*)\.test(\.(?:[cm]?[jt]sx?))$/;
const SOURCE_FILE = /^(.*)(\.(?:[cm]?[jt]sx?))$/;

function usage(): never {
  console.error(`Usage: pnpm test:coverage:file <source-or-test-path>

Examples:
  pnpm test:coverage:file lib/paths.ts
  pnpm test:coverage:file lib/paths.test.ts
`);
  process.exit(1);
}

function toRepoRelative(input: string): string {
  const absolute = resolve(root, input);
  return relative(root, absolute).split("\\").join("/");
}

function resolvePair(input: string): { source: string; test: string } {
  const path = toRepoRelative(input);

  const asTest = path.match(TEST_FILE);
  if (asTest) {
    return { source: `${asTest[1]}${asTest[2]}`, test: path };
  }

  const asSource = path.match(SOURCE_FILE);
  if (asSource) {
    return { source: path, test: `${asSource[1]}.test${asSource[2]}` };
  }

  console.error(
    `Unrecognized path (expected .ts/.tsx/… or *.test.*): ${input}`,
  );
  usage();
}

const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
const arg = rawArgs[0];
if (!arg || arg === "-h" || arg === "--help") {
  usage();
}

const { source, test } = resolvePair(arg);
const sourceAbs = resolve(root, source);
const testAbs = resolve(root, test);

if (!existsSync(sourceAbs)) {
  console.error(`Source file not found: ${source}`);
  process.exit(1);
}
if (!existsSync(testAbs)) {
  console.error(`Test file not found: ${test}`);
  process.exit(1);
}

console.error(`Coverage: ${source} ← ${test}`);

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", "--coverage", test, `--coverage.include=${source}`],
  { stdio: "inherit", shell: false, cwd: root },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
