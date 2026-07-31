#!/usr/bin/env node
/**
 * Enforce App Router segment-file conventions:
 * 1. page/layout: route-mirrored default-export names — docs/conventions.md
 * 2. page/layout: PageProps / LayoutProps — docs/nextjs.md § Route props helpers
 * 3. route.ts: RouteContext on handler context arg — docs/nextjs.md § Route props helpers
 *
 * Usage (via package scripts; loads TS with `node --import tsx`):
 *   pnpm lint:routes          # check (exit 1 on mismatch)
 *   pnpm lint:routes:fix     # rewrite names + PageProps/LayoutProps/RouteContext
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pascalCase } from "es-toolkit/string";

const APP_DIR = join(process.cwd(), "app");
const fix = process.argv.includes("--fix");

const EXPORT_RE =
  /export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/;

const HELPER_RE = /\b(Page|Layout)Props<\s*(["'])(\/[^"']*)\2\s*>/;

const ROUTE_CONTEXT_RE = /\bRouteContext<\s*(["'])(\/[^"']*)\1\s*>/;

const META_EXPORT_RE =
  /export\s+(?:async\s+)?function\s+(generateMetadata|generateViewport)\s*\(/g;

const HTTP_METHOD_EXPORT_RE =
  /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g;

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

function walkSegmentFiles(
  dir: string,
  kinds: RegExp,
): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry.startsWith("_") || entry.startsWith("@")) continue;
      out.push(...walkSegmentFiles(full, kinds));
      continue;
    }
    if (kinds.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function walkPageLayoutFiles(dir: string): string[] {
  return walkSegmentFiles(dir, /^(page|layout)\.(tsx|ts|jsx|js)$/);
}

function walkRouteHandlerFiles(dir: string): string[] {
  return walkSegmentFiles(dir, /^route\.(tsx|ts|jsx|js)$/);
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

/** Split a parameter list on top-level commas (respects nested `<>` `{}` `()` and strings). */
function splitTopLevelArgs(params: string): string[] {
  const args: string[] = [];
  let depthParen = 0;
  let depthBrace = 0;
  let depthAngle = 0;
  let inStr: string | null = null;
  let start = 0;

  for (let i = 0; i < params.length; i++) {
    const ch = params[i]!;
    const prev = params[i - 1];

    if (inStr) {
      if (ch === inStr && prev !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(") depthParen++;
    else if (ch === ")") depthParen--;
    else if (ch === "{") depthBrace++;
    else if (ch === "}") depthBrace--;
    else if (ch === "<") depthAngle++;
    else if (ch === ">") depthAngle--;
    else if (
      ch === "," &&
      depthParen === 0 &&
      depthBrace === 0 &&
      depthAngle === 0
    ) {
      args.push(params.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = params.slice(start).trim();
  if (last) args.push(last);
  return args.filter(Boolean);
}

function parseRouteContext(arg: string): { literal: string } | null {
  const m = arg.match(ROUTE_CONTEXT_RE);
  if (!m) return null;
  return { literal: m[2]! };
}

function rewriteContextArg(
  arg: string,
  expectedContextType: string,
): string | null {
  if (parseRouteContext(arg)) {
    return arg.replace(ROUTE_CONTEXT_RE, expectedContextType);
  }

  // `{ params }: SomeType`
  const destructured = arg.match(/^(\{[\s\S]*\})\s*:\s*([\s\S]+)$/);
  if (destructured) {
    return `${destructured[1]}: ${expectedContextType}`;
  }

  // `ctx: SomeType` / `context: SomeType`
  const named = arg.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([\s\S]+)$/);
  if (named) {
    return `${named[1]}: ${expectedContextType}`;
  }

  // Bare `{ params }`
  const bare = arg.match(/^(\{[\s\S]*\})$/);
  if (bare) {
    return `${bare[1]}: ${expectedContextType}`;
  }

  // Bare name `ctx`
  const bareName = arg.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  if (bareName) {
    return `${bareName[1]}: ${expectedContextType}`;
  }

  return null;
}

function findHttpMethodSpans(
  source: string,
): { name: string; span: ParenSpan }[] {
  const out: { name: string; span: ParenSpan }[] = [];
  HTTP_METHOD_EXPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HTTP_METHOD_EXPORT_RE.exec(source)) !== null) {
    const span = extractParenSpan(source, m.index + m[0].length - 1);
    if (!span) continue;
    out.push({ name: m[1]!, span });
  }
  return out;
}

type Failure = {
  file: string;
  kind: "name" | "props" | "meta-props" | "route-context";
  expected: string;
  actual: string | null;
};

const pageLayoutFiles = walkPageLayoutFiles(APP_DIR);
const routeHandlerFiles = walkRouteHandlerFiles(APP_DIR);
const failures: Failure[] = [];
const fixed: string[] = [];

for (const file of pageLayoutFiles) {
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

// --- Route Handlers: RouteContext on 2nd arg when present ---
for (const file of routeHandlerFiles) {
  const rel = relative(process.cwd(), file);
  const expectedLiteral = expectedRouteLiteral(file);
  const expectedContextType = `RouteContext<"${expectedLiteral}">`;

  let source = readFileSync(file, "utf8");
  let fileChanged = false;
  const fileFixes: string[] = [];

  let passSafety = 0;
  while (passSafety++ < 16) {
    let pending: {
      name: string;
      span: ParenSpan;
      args: string[];
      actualLabel: string;
    } | null = null;

    for (const method of findHttpMethodSpans(source)) {
      const args = splitTopLevelArgs(method.span.params);
      if (args.length < 2) continue; // context optional when unused

      const contextArg = args[1]!;
      const parsed = parseRouteContext(contextArg);
      if (parsed && parsed.literal === expectedLiteral) continue;

      pending = {
        name: method.name,
        span: method.span,
        args,
        actualLabel: parsed
          ? `RouteContext<"${parsed.literal}">`
          : `(${method.name} context missing RouteContext)`,
      };
      break;
    }

    if (!pending) break;

    if (fix) {
      const nextContext = rewriteContextArg(
        pending.args[1]!,
        expectedContextType,
      );
      if (nextContext === null) {
        failures.push({
          file: rel,
          kind: "route-context",
          expected: `${expectedContextType} on ${pending.name}`,
          actual: `${pending.actualLabel} (could not autofix)`,
        });
        break;
      }
      const nextParams = [pending.args[0], nextContext, ...pending.args.slice(2)]
        .join(", ");
      source =
        source.slice(0, pending.span.openIdx + 1) +
        nextParams +
        source.slice(pending.span.closeIdx);
      fileChanged = true;
      fileFixes.push(`${pending.name} → ${expectedContextType}`);
      continue;
    }

    failures.push({
      file: rel,
      kind: "route-context",
      expected: `${expectedContextType} on ${pending.name}`,
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
    `check-route-export-names: ok (${pageLayoutFiles.length} page/layout, ${routeHandlerFiles.length} route${fixedNote})`,
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
