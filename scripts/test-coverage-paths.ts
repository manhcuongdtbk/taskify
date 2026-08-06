/**
 * Run Vitest coverage for colocated source ↔ `*.test.*` pair(s).
 *
 *   pnpm test:coverage:paths constants/pricing-plans.ts
 *   pnpm test:coverage:paths lib/paths.ts lib/utils.ts
 *   pnpm test:coverage:paths lib constants
 *   pnpm test:coverage:paths lib/paths.test.ts actions/create-board/
 *
 * Pass source files, test files, and/or folders (mixed OK; folders are recursive).
 * Trailing slash on folders is optional (`lib` and `lib/` are the same).
 * Docs: docs/testing.md (Run)
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

/** Match Vitest include `*.test.?(c|m)[jt]s?(x)` for common TS/JS extensions. */
const TEST_FILE = /^(.*)\.test(\.(?:[cm]?[jt]sx?))$/;
const SOURCE_FILE = /^(.*)(\.(?:[cm]?[jt]sx?))$/;

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  "coverage",
  "dist",
  "build",
]);

type Pair = { source: string; test: string };

function usage(): never {
  console.error(`Usage: pnpm test:coverage:paths <path> [...]

Paths may be source files, *.test.* files, and/or folders (recursive).

Examples:
  pnpm test:coverage:paths lib/paths.ts
  pnpm test:coverage:paths lib/paths.ts lib/utils.ts
  pnpm test:coverage:paths lib constants
  pnpm test:coverage:paths lib/paths.test.ts actions/create-board/

Trailing slash on folders is optional (lib and lib/ are the same).
`);
  process.exit(1);
}

function toRepoRelative(input: string): string {
  const absolute = resolve(root, input);
  return relative(root, absolute).split("\\").join("/");
}

function pairFromTestPath(testPath: string): Pair {
  const asTest = testPath.match(TEST_FILE);
  if (!asTest) {
    throw new Error(`Not a test file: ${testPath}`);
  }
  return { source: `${asTest[1]}${asTest[2]}`, test: testPath };
}

function pairFromSourceOrTest(input: string): Pair {
  const path = toRepoRelative(input);

  const asTest = path.match(TEST_FILE);
  if (asTest) {
    return pairFromTestPath(path);
  }

  const asSource = path.match(SOURCE_FILE);
  if (asSource) {
    return { source: path, test: `${asSource[1]}.test${asSource[2]}` };
  }

  console.error(
    `Unrecognized path (expected .ts/.tsx/…, *.test.*, or a folder): ${input}`,
  );
  usage();
}

function* walkFiles(dirAbs: string): Generator<string> {
  for (const ent of readdirSync(dirAbs, { withFileTypes: true })) {
    if (ent.name.startsWith(".") || SKIP_DIR_NAMES.has(ent.name)) {
      continue;
    }
    const full = join(dirAbs, ent.name);
    if (ent.isDirectory()) {
      yield* walkFiles(full);
    } else if (ent.isFile()) {
      yield full;
    }
  }
}

function collectPairsFromFolder(dirInput: string): Pair[] {
  const dirAbs = resolve(root, dirInput);
  const pairs: Pair[] = [];

  for (const fileAbs of walkFiles(dirAbs)) {
    const rel = toRepoRelative(fileAbs);
    if (!TEST_FILE.test(rel)) {
      continue;
    }
    const pair = pairFromTestPath(rel);
    if (!existsSync(resolve(root, pair.source))) {
      console.error(
        `Warning: skipping ${pair.test} (missing source ${pair.source})`,
      );
      continue;
    }
    pairs.push(pair);
  }

  return pairs;
}

function addPair(pairsByTest: Map<string, Pair>, pair: Pair): void {
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

const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
if (rawArgs.length === 0 || rawArgs[0] === "-h" || rawArgs[0] === "--help") {
  usage();
}

const pairsByTest = new Map<string, Pair>();

for (const arg of rawArgs) {
  const abs = resolve(root, arg);
  if (!existsSync(abs)) {
    console.error(`Path not found: ${arg}`);
    process.exit(1);
  }

  if (statSync(abs).isDirectory()) {
    const fromFolder = collectPairsFromFolder(arg);
    if (fromFolder.length === 0) {
      console.error(`No colocated *.test.* pairs under folder: ${arg}`);
      process.exit(1);
    }
    for (const pair of fromFolder) {
      addPair(pairsByTest, pair);
    }
    continue;
  }

  addPair(pairsByTest, pairFromSourceOrTest(arg));
}

const pairs = [...pairsByTest.values()].sort((a, b) =>
  a.test.localeCompare(b.test),
);

if (pairs.length === 0) {
  console.error("No coverage pairs resolved.");
  process.exit(1);
}

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
  // Windows resolves `pnpm` through the `pnpm.CMD` shim, which needs a shell.
  shell: process.platform === "win32",
  cwd: root,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
