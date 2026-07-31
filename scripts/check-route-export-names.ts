#!/usr/bin/env node
/**
 * Enforce App Router page.tsx / layout.tsx conventions:
 * 1. Route-mirrored default-export names — docs/conventions.md § Route-mirrored page/layout names
 * 2. PageProps / LayoutProps with the correct route literal — docs/nextjs.md § Route props helpers
 *
 * Usage (via package scripts; loads TS with `node --import tsx`):
 *   pnpm lint:routes          # check (exit 1 on mismatch)
 *   pnpm lint:routes:fix     # rewrite export names + PageProps/LayoutProps
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pascalCase } from "es-toolkit/string";

const APP_DIR = join(process.cwd(), "app");
const fix = process.argv.includes("--fix");

const EXPORT_RE =
  /export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/;

const HELPER_RE = /\b(Page|Layout)Props<\s*(["'])(\/[^"']*)\2\s*>/;

const META_EXPORT_RE =
  /export\s+(?:async\s+)?function\s+(generateMetadata|generateViewport)\s*\(/g;

type Identity = { value: string; dynamic: boolean };
type RouteGroupPart = { routeGroup: string };
type ParsedPart = Identity | RouteGroupPart;

type ParenSpan = { openIdx: number; closeIdx: number; params: string };

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

function routeFileKind(filePath: string): "page" | "layout" {
  const base = filePath.split(sep).pop() ?? "";
  return base.startsWith("layout") ? "layout" : "page";
}

/** URL path literal for PageProps / LayoutProps (route groups / private / slots omitted). */
function expectedRouteLiteral(filePath: string): string {
  const rel = relative(APP_DIR, filePath);
  const parts = rel.split(sep);
  parts.pop(); // page.tsx / layout.tsx

  const segments: string[] = [];
  for (const part of parts) {
    if (part.startsWith("@") || part.startsWith("_")) continue;
    if (/^\(.+\)$/.test(part)) continue;
    segments.push(part);
  }

  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
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

function applyNameFix(source: string, actual: string, expected: string): string {
  let next = source.replace(EXPORT_RE, (full) =>
    full.replace(new RegExp(`\\b${actual}\\b`), expected),
  );
  // Legacy handwritten *Props rename if present
  next = next.replaceAll(
    new RegExp(`\\b${actual}Props\\b`, "g"),
    `${expected}Props`,
  );
  return next;
}

/** Given index of '(', return span through matching ')' or null. */
function extractParenSpan(
  source: string,
  openParenIdx: number,
): ParenSpan | null {
  if (source[openParenIdx] !== "(") return null;
  let depth = 0;
  let inStr: string | null = null;
  for (let i = openParenIdx; i < source.length; i++) {
    const ch = source[i]!;
    const prev = source[i - 1];

    if (inStr) {
      if (ch === inStr && prev !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return {
          openIdx: openParenIdx,
          closeIdx: i,
          params: source.slice(openParenIdx + 1, i),
        };
      }
    }
  }
  return null;
}

function findDefaultExportSpan(source: string): ParenSpan | null {
  const m = source.match(
    /export\s+default\s+(?:async\s+)?function\s+[A-Za-z0-9_]+\s*\(/,
  );
  if (!m || m.index === undefined) return null;
  return extractParenSpan(source, m.index + m[0].length - 1);
}

function findMetaExportSpans(
  source: string,
): { name: string; span: ParenSpan }[] {
  const out: { name: string; span: ParenSpan }[] = [];
  META_EXPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = META_EXPORT_RE.exec(source)) !== null) {
    const span = extractParenSpan(source, m.index + m[0].length - 1);
    if (!span) continue;
    out.push({ name: m[1]!, span });
  }
  return out;
}

function parseHelper(
  paramList: string,
): { helper: "Page" | "Layout"; literal: string } | null {
  const m = paramList.match(HELPER_RE);
  if (!m) return null;
  return { helper: m[1] as "Page" | "Layout", literal: m[3]! };
}

/** True when the param list is empty or only whitespace / comments — no props typed. */
function hasTypedOrDestructuredParams(paramList: string): boolean {
  const stripped = paramList
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
  return stripped.length > 0;
}

/**
 * Rewrite a function parameter list to use the expected helper.
 * Returns null when the shape is too unusual to fix safely.
 */
function rewriteParamList(
  params: string,
  expectedHelperType: string,
): string | null {
  const helper = parseHelper(params);
  if (helper) {
    return params.replace(HELPER_RE, expectedHelperType);
  }

  if (!hasTypedOrDestructuredParams(params)) {
    // Empty params: helper is optional — nothing to rewrite
    return params;
  }

  // `{ … }: SomeType` → keep binding, replace type
  const destructured = params.match(/^(\{[\s\S]*\})\s*:\s*([\s\S]+)$/);
  if (destructured) {
    const binding = destructured[1]!;
    const bindingInner = binding.slice(1, -1);
    if (!hasTypedOrDestructuredParams(bindingInner)) {
      return `{}: ${expectedHelperType}`;
    }
    return `${binding}: ${expectedHelperType}`;
  }

  // `props: SomeType` / `name: SomeType`
  const named = params.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([\s\S]+)$/);
  if (named) {
    return `${named[1]}: ${expectedHelperType}`;
  }

  // Destructure with no type: `{ children }` / `{ params }`
  const bareDestructure = params.match(/^(\{[\s\S]*\})$/);
  if (bareDestructure) {
    const binding = bareDestructure[1]!;
    const bindingInner = binding.slice(1, -1);
    if (!hasTypedOrDestructuredParams(bindingInner)) {
      return `{}: ${expectedHelperType}`;
    }
    return `${binding}: ${expectedHelperType}`;
  }

  return null;
}

function applyParamListFix(
  source: string,
  span: ParenSpan,
  expectedHelperType: string,
): { source: string; ok: boolean } {
  const nextParams = rewriteParamList(span.params, expectedHelperType);
  if (nextParams === null) return { source, ok: false };
  if (nextParams === span.params) return { source, ok: true };
  const next =
    source.slice(0, span.openIdx + 1) +
    nextParams +
    source.slice(span.closeIdx);
  return { source: next, ok: true };
}

function helperMatches(
  params: string,
  expectedHelper: "Page" | "Layout",
  expectedLiteral: string,
): boolean {
  const helper = parseHelper(params);
  return (
    helper !== null &&
    helper.helper === expectedHelper &&
    helper.literal === expectedLiteral
  );
}

/**
 * Helper is required only when the signature takes real props (or opts into a type).
 * `function Page()` / `function Page({})` — optional, no check.
 * `function Page({}: PageProps<…>)` — optional form, but if a type is present it must be correct.
 * `function Layout({ children })` / `({ params }: …)` — required.
 */
function needsPropsHelper(params: string): boolean {
  const stripped = params
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
  if (!stripped) return false;
  if (/^\{\s*\}$/.test(stripped)) return false;
  return true;
}

type Failure = {
  file: string;
  kind: "name" | "props" | "meta-props";
  expected: string;
  actual: string | null;
};

const files = walkRouteFiles(APP_DIR);
const failures: Failure[] = [];
const fixed: string[] = [];

for (const file of files) {
  const rel = relative(process.cwd(), file);
  const kind = routeFileKind(file);
  const expectedHelper = kind === "layout" ? "Layout" : "Page";
  const expectedLiteral = expectedRouteLiteral(file);
  const expectedHelperType = `${expectedHelper}Props<"${expectedLiteral}">`;

  let source = readFileSync(file, "utf8");
  let fileChanged = false;
  const fileFixes: string[] = [];

  // --- 1) default-export name ---
  const expectedName = expectedExportName(file);
  const nameMatch = source.match(EXPORT_RE);
  const actualName = nameMatch?.[1] ?? null;

  if (actualName !== expectedName) {
    if (fix && actualName) {
      source = applyNameFix(source, actualName, expectedName);
      fileChanged = true;
      fileFixes.push(`${actualName} → ${expectedName}`);
    } else {
      failures.push({
        file: rel,
        kind: "name",
        expected: expectedName,
        actual: actualName,
      });
    }
  }

  // --- 2) default-export PageProps / LayoutProps (only when props are declared) ---
  const defaultSpan = findDefaultExportSpan(source);
  if (defaultSpan === null) {
    failures.push({
      file: rel,
      kind: "props",
      expected: expectedHelperType,
      actual: "(no export default function found)",
    });
  } else if (
    needsPropsHelper(defaultSpan.params) &&
    !helperMatches(defaultSpan.params, expectedHelper, expectedLiteral)
  ) {
    const actual = parseHelper(defaultSpan.params);
    const actualLabel = actual
      ? `${actual.helper}Props<"${actual.literal}">`
      : "(missing PageProps/LayoutProps on default export)";

    if (fix) {
      const result = applyParamListFix(source, defaultSpan, expectedHelperType);
      if (result.ok) {
        source = result.source;
        fileChanged = true;
        fileFixes.push(`props → ${expectedHelperType}`);
      } else {
        failures.push({
          file: rel,
          kind: "props",
          expected: expectedHelperType,
          actual: `${actualLabel} (could not autofix)`,
        });
      }
    } else {
      failures.push({
        file: rel,
        kind: "props",
        expected: expectedHelperType,
        actual: actualLabel,
      });
    }
  }

  // --- 3) generateMetadata / generateViewport: if they take args, require same helper ---
  // Re-scan after each rewrite so indices stay valid.
  let metaPassSafety = 0;
  while (metaPassSafety++ < 8) {
    let pending: {
      name: string;
      span: ParenSpan;
      actualLabel: string;
    } | null = null;

    for (const meta of findMetaExportSpans(source)) {
      if (!hasTypedOrDestructuredParams(meta.span.params)) continue;
      if (helperMatches(meta.span.params, expectedHelper, expectedLiteral)) {
        continue;
      }
      const actual = parseHelper(meta.span.params);
      pending = {
        name: meta.name,
        span: meta.span,
        actualLabel: actual
          ? `${actual.helper}Props<"${actual.literal}">`
          : `(${meta.name} has params but missing PageProps/LayoutProps)`,
      };
      break;
    }

    if (!pending) break;

    if (fix) {
      const result = applyParamListFix(
        source,
        pending.span,
        expectedHelperType,
      );
      if (result.ok) {
        source = result.source;
        fileChanged = true;
        fileFixes.push(`${pending.name} props → ${expectedHelperType}`);
        continue;
      }
      failures.push({
        file: rel,
        kind: "meta-props",
        expected: `${expectedHelperType} on ${pending.name}`,
        actual: `${pending.actualLabel} (could not autofix)`,
      });
      break;
    }

    failures.push({
      file: rel,
      kind: "meta-props",
      expected: `${expectedHelperType} on ${pending.name}`,
      actual: pending.actualLabel,
    });
    break;
  }

  if (fileChanged) {
    writeFileSync(file, source, "utf8");
    fixed.push(rel);
    console.log(`fixed ${rel}: ${fileFixes.join("; ")}`);
  }
}

if (failures.length === 0) {
  const fixedNote = fixed.length ? `, fixed ${fixed.length}` : "";
  console.log(
    `check-route-export-names: ok (${files.length} page/layout files${fixedNote})`,
  );
  process.exit(0);
}

console.error("check-route-export-names: mismatches:\n");
for (const f of failures) {
  console.error(`  ${f.file} [${f.kind}]`);
  console.error(`    expected: ${f.expected}`);
  console.error(`    actual:   ${f.actual ?? "(none)"}`);
  console.error("");
}
console.error(
  "See docs/conventions.md § Route-mirrored page/layout names and docs/nextjs.md § Route props helpers",
);
if (!fix) {
  console.error("Hint: pnpm lint:routes:fix");
}
process.exit(1);
