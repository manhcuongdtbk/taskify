#!/usr/bin/env node
/**
 * Enforce route-mirrored default-export names for App Router page.tsx / layout.tsx.
 * Spec: docs/conventions.md § Route-mirrored page/layout names
 *
 * Usage (via package scripts; loads TS with `node --import tsx`):
 *   pnpm lint:routes          # check (exit 1 on mismatch)
 *   pnpm lint:routes:fix     # rewrite export names (+ *Props)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pascalCase } from "es-toolkit/string";

const APP_DIR = join(process.cwd(), "app");
const fix = process.argv.includes("--fix");

const EXPORT_RE =
  /export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/;

type Identity = { value: string; dynamic: boolean };
type RouteGroupPart = { routeGroup: string };
type ParsedPart = Identity | RouteGroupPart;

function parsePart(part: string): ParsedPart | null {
  if (part.startsWith("@") || part.startsWith("_")) return null;

  const group = part.match(/^\((.+)\)$/);
  if (group) return { routeGroup: group[1]! };

  const optionalCatchAll = part.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optionalCatchAll) {
    return { value: pascalCase(optionalCatchAll[1]!), dynamic: true };
  }

  const catchAll = part.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) {
    return { value: pascalCase(catchAll[1]!), dynamic: true };
  }

  const dynamic = part.match(/^\[(.+)\]$/);
  if (dynamic) {
    return { value: pascalCase(dynamic[1]!), dynamic: true };
  }

  return { value: pascalCase(part), dynamic: false };
}

function expectedExportName(filePath: string): string {
  const rel = relative(APP_DIR, filePath);
  const parts = rel.split(sep);
  const fileName = parts.pop()!;
  const suffix = fileName.startsWith("layout") ? "Layout" : "Page";

  const identities: Identity[] = [];
  const routeGroups: string[] = [];

  for (const part of parts) {
    const parsed = parsePart(part);
    if (!parsed) continue;
    if ("routeGroup" in parsed) {
      routeGroups.push(parsed.routeGroup);
      continue;
    }
    identities.push(parsed);
  }

  if (identities.length === 0) {
    if (routeGroups.length > 0) {
      identities.push({
        value: pascalCase(routeGroups[routeGroups.length - 1]!),
        dynamic: false,
      });
    } else {
      identities.push({ value: "Root", dynamic: false });
    }
  }

  // Deduplicate consecutive identical tokens (sign-in / [[...sign-in]])
  const deduped: Identity[] = [];
  for (const id of identities) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.value === id.value) continue;
    deduped.push(id);
  }

  if (deduped.length === 1) {
    return deduped[0]!.value + suffix;
  }

  const last = deduped[deduped.length - 1]!;
  if (last.dynamic) {
    return last.value + suffix;
  }

  const firstStatic = deduped.find((id) => !id.dynamic);
  const resource = firstStatic?.value ?? deduped[0]!.value;
  return resource + last.value + suffix;
}

function walkRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry.startsWith("_") || entry.startsWith("@")) continue;
      out.push(...walkRouteFiles(full));
      continue;
    }
    if (/^(page|layout)\.(tsx|ts|jsx|js)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function applyFix(source: string, actual: string, expected: string): string {
  let next = source.replace(EXPORT_RE, (full) =>
    full.replace(new RegExp(`\\b${actual}\\b`), expected),
  );
  // Keep props types in sync: BoardIdPageProps → expectedProps
  next = next.replaceAll(
    new RegExp(`\\b${actual}Props\\b`, "g"),
    `${expected}Props`,
  );
  return next;
}

type Failure = {
  file: string;
  expected: string;
  actual: string | null;
};

const files = walkRouteFiles(APP_DIR);
const failures: Failure[] = [];
const fixed: string[] = [];

for (const file of files) {
  const expected = expectedExportName(file);
  const source = readFileSync(file, "utf8");
  const match = source.match(EXPORT_RE);
  const actual = match?.[1] ?? null;
  const rel = relative(process.cwd(), file);

  if (actual === expected) continue;

  if (fix && actual) {
    writeFileSync(file, applyFix(source, actual, expected), "utf8");
    fixed.push(rel);
    console.log(`fixed ${rel}: ${actual} → ${expected}`);
    continue;
  }

  failures.push({ file: rel, expected, actual });
}

if (failures.length === 0) {
  const fixedNote = fixed.length ? `, fixed ${fixed.length}` : "";
  console.log(
    `check-route-export-names: ok (${files.length} page/layout files${fixedNote})`,
  );
  process.exit(0);
}

console.error("check-route-export-names: naming mismatches:\n");
for (const f of failures) {
  console.error(`  ${f.file}`);
  console.error(`    expected: ${f.expected}`);
  console.error(
    `    actual:   ${f.actual ?? "(no export default function found)"}`,
  );
  console.error("");
}
console.error("See docs/conventions.md § Route-mirrored page/layout names");
if (!fix) {
  console.error("Hint: pnpm lint:routes:fix");
}
process.exit(1);
