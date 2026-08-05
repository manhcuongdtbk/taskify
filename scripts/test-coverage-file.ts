/**
 * Run Vitest coverage for colocated source ↔ `*.test.*` pair(s).
 *
 *   pnpm test:coverage:file constants/pricing-plans.ts
 *   pnpm test:coverage:file lib/paths.ts lib/utils.ts
 *   pnpm test:coverage:file lib/paths.test.ts constants/pricing-plans.ts
 *
 * Pass source and/or test paths (mixed OK). Docs: docs/testing.md (Run)
 */
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

/** Match Vitest include `*.test.?(c|m)[jt]s?(x)` for common TS/JS extensions. */
const TEST_FILE = /^(.*)\.test(\.(?:[cm]?[jt]sx?))$/;
const SOURCE_FILE = /^(.*)(\.(?:[cm]?[jt]sx?))$/;

function usage(): never {
  console.error(`Usage: pnpm test:coverage:file <source-or-test-path> [...]

Examples:
  pnpm test:coverage:file lib/paths.ts
  pnpm test:coverage:file lib/paths.ts lib/utils.ts
  pnpm test:coverage:file lib/paths.test.ts constants/pricing-plans.ts
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
if (rawArgs.length === 0 || rawArgs[0] === "-h" || rawArgs[0] === "--help") {
  usage();
}

const pairsByTest = new Map<string, { source: string; test: string }>();

for (const arg of rawArgs) {
  const pair = resolvePair(arg);
  const sourceAbs = resolve(root, pair.source);
  const testAbs = resolve(root, pair.test);

  if (!existsSync(sourceAbs)) {
    console.error(`Source file not found: ${pair.source}`);
    process.exit(1);
  }
  if (!existsSync(testAbs)) {
    console.error(`Test file not found: ${pair.test}`);
    process.exit(1);
  }

  pairsByTest.set(pair.test, pair);
}

const pairs = [...pairsByTest.values()];
for (const { source, test } of pairs) {
  console.error(`Coverage: ${source} ← ${test}`);
}

const vitestArgs = [
  "exec",
  "vitest",
  "run",
  "--coverage",
  ...pairs.map((p) => p.test),
  ...pairs.map((p) => `--coverage.include=${p.source}`),
];

const result = spawnSync("pnpm", vitestArgs, {
  stdio: "inherit",
  shell: false,
  cwd: root,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
