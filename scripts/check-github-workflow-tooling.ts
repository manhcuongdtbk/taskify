#!/usr/bin/env node
/**
 * GitHub Actions must use the same Node and pnpm as mise (`mise.toml` / `mise.lock`).
 *
 * Workflows install them only via `.github/actions/setup-mise` — no parallel
 * `actions/setup-node` / `pnpm/action-setup` version pins.
 *
 * Marketplace `uses:` must be a **floating major tag** (`actions/checkout@v7`),
 * not older than this repo’s floor (documented fallback raised by the highest
 * major already pinned for that action), a patch pin, or a commit SHA — unless
 * listed in `ACTION_PIN_EXCEPTIONS` with a reason. A live GitHub major newer
 * than the pin **warns** (Dependabot bump) and does not fail this check.
 * Latest major is the highest `vN` tag (`/git/matching-refs/tags/v`), not
 * `/releases/latest`. Timeout; set `GITHUB_TOKEN` or `GH_TOKEN` in CI. Dependabot ignores
 * patch/minor so it does not rewrite `@v7` → `@v7.0.1`.
 * Docs: docs/conventions.md.
 *
 *   pnpm lint:workflows
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { mapAsync, uniq } from "es-toolkit";

import {
  FALLBACK_LATEST_MAJOR,
  evaluateMarketplacePin,
  latestMajorFromTagRefs,
  majorFromRef,
  pinFloorMajor,
} from "./github-workflow-pins";

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

const GITHUB_API_TIMEOUT_MS = 10_000;
const errors: string[] = [];
const warnings: string[] = [];

void main().catch((reason: unknown) => {
  console.error(reason);
  process.exit(1);
});

async function main(): Promise<void> {
  const files = readGithubYaml();
  checkSetupAction(files);
  checkWorkflows(files);
  await checkMarketplacePins(files);

  if (warnings.length > 0) {
    console.warn(warnings.join("\n"));
  }

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
  const liveMajorByRepo = await resolveLiveMajors(
    uniq(pins.map((pin) => pin.repo)),
  );

  const adoptedMajorsByRepo = new Map<string, number[]>();
  for (const pin of pins) {
    if (!/^v\d+$/.test(pin.ref)) {
      continue;
    }
    const major = majorFromRef(pin.ref);
    if (major == null) {
      continue;
    }
    const adopted = adoptedMajorsByRepo.get(pin.repo) ?? [];
    adopted.push(major);
    adoptedMajorsByRepo.set(pin.repo, adopted);
  }

  for (const pin of pins) {
    const spec = `${pin.repo}@${pin.ref}`;
    if (ACTION_PIN_EXCEPTIONS[spec]) {
      continue;
    }

    const verdict = evaluateMarketplacePin({
      spec,
      rel: pin.rel,
      ref: pin.ref,
      liveMajor: liveMajorByRepo.get(pin.repo) ?? null,
      floorMajor: pinFloorMajor(
        FALLBACK_LATEST_MAJOR[pin.repo],
        adoptedMajorsByRepo.get(pin.repo) ?? [],
      ),
    });

    if (verdict.severity === "error") {
      errors.push(verdict.message);
    } else if (verdict.severity === "warn") {
      warnings.push(verdict.message);
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

async function resolveLiveMajors(
  repos: string[],
): Promise<Map<string, number>> {
  const entries = await mapAsync(repos, async (repo) => {
    return [repo, await fetchLatestMajor(repo)] as const;
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
