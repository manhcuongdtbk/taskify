#!/usr/bin/env node
/**
 * GitHub Actions must use the same Node and pnpm as mise (`mise.toml` / `mise.lock`).
 *
 * Workflows install them only via `.github/actions/setup-mise` — no parallel
 * `actions/setup-node` / `pnpm/action-setup` version pins.
 *
 * Marketplace `uses:` must be the **current major tag** (`actions/checkout@v7`),
 * not an older major, a patch pin, or a commit SHA — unless listed in
 * `ACTION_PIN_EXCEPTIONS` with a reason. Latest major is the highest `vN`
 * tag (`/git/matching-refs/tags/v`), not `/releases/latest` (that follows the
 * newest GitHub Release, which can lag or skip a moving major tag). Timeout;
 * set `GITHUB_TOKEN` or `GH_TOKEN` in CI. Dependabot ignores patch/minor so
 * it does not rewrite `@v7` → `@v7.0.1`.
 * Docs: docs/conventions.md.
 *
 *   pnpm lint:workflows
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { isJSONObject, mapAsync, uniq } from "es-toolkit";

const ROOT = process.cwd();
const GITHUB_DIR = join(ROOT, ".github");
const SETUP_ACTION = ".github/actions/setup-mise";
const SETUP_REL = `${SETUP_ACTION}/action.yml`;
const MISE_OWNS = `mise owns Node/pnpm (${SETUP_ACTION})`;

const SETUP_USES = /uses:\s*['"]?\.\/\.github\/actions\/setup-mise/;
const MARKETPLACE_USES_RE =
  /uses:\s*['"]?([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)@([^\s'"#]+)/g;

type PatternRule = { id: string; pattern: RegExp };
type YamlFile = { rel: string; source: string };
type Pin = { repo: string; ref: string; rel: string };

const FORBID_MISE_BYPASS: PatternRule[] = [
  { id: "node-version", pattern: /^\s*node-version:/m },
  { id: "node-version-file", pattern: /^\s*node-version-file:/m },
  { id: "pnpm/action-setup", pattern: /pnpm\/action-setup/ },
];

const FORBID_IN_WORKFLOWS: PatternRule[] = [
  { id: "actions/setup-node", pattern: /actions\/setup-node/ },
  { id: "jdx/mise-action", pattern: /jdx\/mise-action/ },
  ...FORBID_MISE_BYPASS,
];

/**
 * Older / patch / SHA pins that are allowed. Key is `owner/repo@ref`.
 * Add a one-line reason; do not use this to stay on a stale major by default.
 */
const ACTION_PIN_EXCEPTIONS: Record<string, string> = {};

/** Used when GitHub’s API is unreachable (offline lint). Prefer live latest. */
const FALLBACK_LATEST_MAJOR: Record<string, number> = {
  "actions/checkout": 7,
  "actions/setup-node": 7,
  "jdx/mise-action": 4,
};

const GITHUB_API_TIMEOUT_MS = 10_000;
const errors: string[] = [];

void main().catch((reason: unknown) => {
  console.error(reason);
  process.exit(1);
});

async function main(): Promise<void> {
  const files = readGithubYaml();
  checkSetupAction(files);
  checkWorkflows(files);
  await checkMarketplacePins(files);

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
}

function readGithubYaml(): YamlFile[] {
  return readdirSync(GITHUB_DIR, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .map((name) => {
      const file = join(GITHUB_DIR, name);
      return { rel: relative(ROOT, file), source: readFileSync(file, "utf8") };
    });
}

function checkSetupAction(files: YamlFile[]): void {
  const setup = files.find((file) => file.rel === SETUP_REL);
  if (!setup) {
    errors.push(`${SETUP_REL} is missing`);
    return;
  }
  if (!setup.source.includes("jdx/mise-action")) {
    errors.push(`${SETUP_REL} must use jdx/mise-action`);
  }
  forbid(setup.source, SETUP_REL, FORBID_MISE_BYPASS);
}

function checkWorkflows(files: YamlFile[]): void {
  const workflows = files.filter((file) =>
    file.rel.startsWith(".github/workflows/"),
  );
  if (workflows.length === 0) {
    errors.push("no GitHub workflow files found under .github/workflows");
    return;
  }

  for (const { rel, source } of workflows) {
    forbid(source, rel, FORBID_IN_WORKFLOWS);
    if (/\bpnpm\b/.test(source) && !SETUP_USES.test(source)) {
      errors.push(
        `${rel}: jobs that run pnpm must use ${SETUP_ACTION} so Node/pnpm match mise`,
      );
    }
  }
}

async function checkMarketplacePins(files: YamlFile[]): Promise<void> {
  const pins = marketplacePinsFrom(files);
  const latestMajorByRepo = await resolveLatestMajors(
    uniq(pins.map((pin) => pin.repo)),
  );

  for (const pin of pins) {
    const spec = `${pin.repo}@${pin.ref}`;
    if (ACTION_PIN_EXCEPTIONS[spec]) {
      continue;
    }

    const latestMajor = latestMajorByRepo.get(pin.repo);
    const usedMajor = majorFromRef(pin.ref);
    const example = `@v${latestMajor ?? usedMajor ?? "N"}`;

    if (!/^v\d+$/.test(pin.ref)) {
      errors.push(
        `${pin.rel}: ${spec} must be the current major tag (e.g. ${example}) unless listed in ACTION_PIN_EXCEPTIONS with a reason`,
      );
      continue;
    }

    if (latestMajor != null && usedMajor != null && usedMajor !== latestMajor) {
      errors.push(
        `${pin.rel}: ${spec} is not the latest major (@v${latestMajor}) — bump it, or add ACTION_PIN_EXCEPTIONS with a reason`,
      );
    }
  }
}

function forbid(
  source: string,
  rel: string,
  rules: readonly PatternRule[],
): void {
  for (const { id, pattern } of rules) {
    if (pattern.test(source)) {
      errors.push(`${rel}: do not use ${id} — ${MISE_OWNS}`);
    }
  }
}

function marketplacePinsFrom(files: YamlFile[]): Pin[] {
  const pins: Pin[] = [];
  for (const { rel, source } of files) {
    for (const match of source.matchAll(MARKETPLACE_USES_RE)) {
      const repo = match[1];
      const ref = match[2];
      if (repo && ref) {
        pins.push({ repo, ref, rel });
      }
    }
  }
  return pins;
}

function majorFromRef(ref: string): number | null {
  const match = /^v?(\d+)/.exec(ref);
  return match ? Number(match[1]) : null;
}

async function resolveLatestMajors(
  repos: string[],
): Promise<Map<string, number>> {
  const entries = await mapAsync(repos, async (repo) => {
    const major = (await fetchLatestMajor(repo)) ?? FALLBACK_LATEST_MAJOR[repo];
    return [repo, major] as const;
  });

  return new Map(
    entries.filter((entry): entry is readonly [string, number] => {
      return entry[1] != null;
    }),
  );
}

function githubApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "taskify-lint-workflows",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Highest floating major tag (`v7`, not `v7.0.1`). */
function latestMajorFromTagRefs(body: unknown): number | null {
  if (!Array.isArray(body)) {
    return null;
  }

  const majors: number[] = [];
  for (const item of body) {
    if (!isJSONObject(item) || typeof item.ref !== "string") {
      continue;
    }
    const tag = item.ref.replace(/^refs\/tags\//u, "");
    if (!/^v\d+$/u.test(tag)) {
      continue;
    }
    const major = majorFromRef(tag);
    if (major != null) {
      majors.push(major);
    }
  }

  return majors.length > 0 ? Math.max(...majors) : null;
}

async function fetchLatestMajor(repo: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/git/matching-refs/tags/v`,
      {
        headers: githubApiHeaders(),
        signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      return null;
    }
    return latestMajorFromTagRefs(await response.json());
  } catch {
    return null;
  }
}
