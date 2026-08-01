/**
 * File-support predicates + reports derived from ESLint / Prettier themselves
 * (not a hand-maintained extension allowlist).
 *
 * Docs: docs/conventions.md § Lint & format: one contract
 * Print live lists: `pnpm lint:file-support` (add `-- --all` for Prettier’s full matrix)
 */
import { execFileSync } from "node:child_process";
import { basename, extname } from "node:path";
import { ESLint } from "eslint";
import { uniq } from "es-toolkit";
import prettier from "prettier";

const eslint = new ESLint();

/** True when this repo’s ESLint config applies to the path (not ignored / unmatched). */
export const isEslintPath = async (filePath: string): Promise<boolean> => {
  try {
    return !(await eslint.isPathIgnored(filePath));
  } catch {
    // Unmatched / broken config for the path (e.g. extension outside Next’s plugin set).
    return false;
  }
};

/**
 * True when Prettier will format the path (has a parser and is not in `.prettierignore`).
 * Uses Prettier’s own `getFileInfo` / support matrix.
 */
export const isPrettierPath = async (filePath: string): Promise<boolean> => {
  const info = await prettier.getFileInfo(filePath, {
    ignorePath: ".prettierignore",
    resolveConfig: true,
  });
  if (info.ignored) return false;
  if (info.inferredParser) return true;

  // Fallback: match against getSupportInfo (covers odd basenames if getFileInfo is null).
  const support = await prettier.getSupportInfo();
  const base = basename(filePath);
  return support.languages.some(
    (lang) =>
      lang.filenames?.includes(base) ||
      lang.isSupported?.({ filepath: filePath }) === true,
  );
};

const uniqSorted = (items: Iterable<string>) => uniq([...items]).sort();

const fmtExts = (exts: string[]) =>
  exts.map((e) => `.${e}`).join(" ") || "(none)";

/** Extensions Prettier knows about (from `prettier.getSupportInfo()`, no leading dot). */
export const listPrettierExtensions = async (): Promise<string[]> => {
  const support = await prettier.getSupportInfo();
  return uniqSorted(
    support.languages.flatMap((lang) =>
      (lang.extensions ?? []).map((ext) => ext.replace(/^\./, "")),
    ),
  );
};

/** Well-known basenames Prettier formats (e.g. `.prettierrc`, `package.json`). */
export const listPrettierFilenames = async (): Promise<string[]> => {
  const support = await prettier.getSupportInfo();
  return uniqSorted(support.languages.flatMap((lang) => lang.filenames ?? []));
};

/**
 * Extensions this repo’s ESLint config will lint.
 * Candidate set = Prettier’s support matrix; filter via `ESLint#isPathIgnored`.
 */
export const listEslintExtensions = async (): Promise<string[]> => {
  const supported: string[] = [];
  for (const ext of await listPrettierExtensions()) {
    // Synthetic path — ESLint still applies `files` / `ignores` globs.
    if (await isEslintPath(`probe.${ext}`)) {
      supported.push(ext);
    }
  }
  return supported;
};

/** Tracked git paths (empty if not a git repo). */
const listGitTrackedFiles = (): string[] => {
  try {
    const out = execFileSync("git", ["ls-files", "-z"], {
      encoding: "buffer",
      maxBuffer: 32 * 1024 * 1024,
    });
    return out
      .toString("utf8")
      .split("\0")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  } catch {
    return [];
  }
};

/**
 * Extensions / basenames that Prettier would format among **tracked** files
 * (what contributors actually have in the tree today).
 */
export const listPrettierTargetsInRepo = async (): Promise<{
  extensions: string[];
  basenames: string[];
}> => {
  const files = listGitTrackedFiles();
  const extensions: string[] = [];
  const basenames: string[] = [];

  await Promise.all(
    files.map(async (filePath) => {
      if (!(await isPrettierPath(filePath))) return;
      const ext = extname(filePath).replace(/^\./, "");
      if (ext) {
        extensions.push(ext);
      } else {
        basenames.push(basename(filePath));
      }
    }),
  );

  return {
    extensions: uniqSorted(extensions),
    basenames: uniqSorted(basenames),
  };
};

export type LintFileSupportReport = {
  eslintExtensions: string[];
  prettierExtensionsAll: string[];
  prettierFilenamesAll: string[];
  prettierExtensionsInRepo: string[];
  prettierBasenamesInRepo: string[];
};

export const getLintFileSupportReport =
  async (): Promise<LintFileSupportReport> => {
    const [
      eslintExtensions,
      prettierExtensionsAll,
      prettierFilenamesAll,
      inRepo,
    ] = await Promise.all([
      listEslintExtensions(),
      listPrettierExtensions(),
      listPrettierFilenames(),
      listPrettierTargetsInRepo(),
    ]);
    return {
      eslintExtensions,
      prettierExtensionsAll,
      prettierFilenamesAll,
      prettierExtensionsInRepo: inRepo.extensions,
      prettierBasenamesInRepo: inRepo.basenames,
    };
  };

export type FormatLintFileSupportOptions = {
  /** Include Prettier’s full `getSupportInfo()` matrix (noisy). */
  all?: boolean;
};

/** Human-readable report for contributors (`pnpm lint:file-support`). */
export const formatLintFileSupportReport = (
  report: LintFileSupportReport,
  options: FormatLintFileSupportOptions = {},
): string => {
  const lines = [
    "Lint / format file support (live from ESLint + Prettier APIs)",
    "",
    "ESLint — extensions this repo’s eslint.config.mjs will lint:",
    `  ${fmtExts(report.eslintExtensions)}`,
    "",
    "Prettier — extensions / basenames among tracked files today (respects .prettierignore):",
    `  extensions: ${fmtExts(report.prettierExtensionsInRepo)}`,
    `  basenames:  ${report.prettierBasenamesInRepo.join(" ") || "(none)"}`,
    "",
    "Overlap: every ESLint extension above also gets Prettier (ESLint first, then Prettier).",
  ];

  if (options.all) {
    lines.push(
      "",
      "Prettier — full getSupportInfo() matrix (any of these may be formatted if added):",
      `  ${fmtExts(report.prettierExtensionsAll)}`,
      "",
      "Prettier — full well-known basenames:",
      `  ${report.prettierFilenamesAll.join(" ") || "(none)"}`,
    );
  } else {
    lines.push(
      "",
      "Tip: `pnpm lint:file-support -- --all` prints Prettier’s complete support matrix.",
    );
  }

  lines.push(
    "",
    "Source: config/lint-files.mts · docs/conventions.md § Lint & format: one contract",
  );

  return lines.join("\n");
};
