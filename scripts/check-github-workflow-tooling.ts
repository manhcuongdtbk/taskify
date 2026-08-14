#!/usr/bin/env node
/**
 * GitHub Actions must use the same Node and pnpm as mise (`mise.toml` / `mise.lock`).
 *
 * Workflows install them only via `.github/actions/setup-mise` — no parallel
 * `actions/setup-node` / `pnpm/action-setup` version pins.
 *
 *   pnpm lint:workflows
 *
 * Docs: docs/conventions.md (Tooling / repo workflow).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WORKFLOWS_DIR = join(ROOT, ".github/workflows");
const SETUP_ACTION = ".github/actions/setup-mise";
const SETUP_ACTION_FILE = join(ROOT, SETUP_ACTION, "action.yml");

const SETUP_USES = /uses:\s*['"]?\.\/\.github\/actions\/setup-mise/;

const FORBIDDEN_IN_WORKFLOWS: { id: string; pattern: RegExp }[] = [
  { id: "actions/setup-node", pattern: /actions\/setup-node/ },
  { id: "pnpm/action-setup", pattern: /pnpm\/action-setup/ },
  { id: "jdx/mise-action", pattern: /jdx\/mise-action/ },
  { id: "node-version", pattern: /^\s*node-version:/m },
  { id: "node-version-file", pattern: /^\s*node-version-file:/m },
];

const errors: string[] = [];

const setupAction = readFileSync(SETUP_ACTION_FILE, "utf8");
if (!setupAction.includes("jdx/mise-action")) {
  errors.push(`${SETUP_ACTION}/action.yml must use jdx/mise-action`);
}
if (/^\s*node-version:/m.test(setupAction)) {
  errors.push(
    `${SETUP_ACTION}/action.yml must not set node-version (mise owns Node)`,
  );
}
if (/^\s*node-version-file:/m.test(setupAction)) {
  errors.push(
    `${SETUP_ACTION}/action.yml must not set node-version-file (mise owns Node)`,
  );
}
if (/pnpm\/action-setup/.test(setupAction)) {
  errors.push(
    `${SETUP_ACTION}/action.yml must not use pnpm/action-setup (mise owns pnpm)`,
  );
}

const workflowFiles = readdirSync(WORKFLOWS_DIR)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .map((name) => join(WORKFLOWS_DIR, name));

if (workflowFiles.length === 0) {
  errors.push("no GitHub workflow files found under .github/workflows");
}

for (const file of workflowFiles) {
  const source = readFileSync(file, "utf8");
  const rel = file.slice(ROOT.length + 1);

  for (const { id, pattern } of FORBIDDEN_IN_WORKFLOWS) {
    if (pattern.test(source)) {
      errors.push(
        `${rel}: do not use ${id} — install Node/pnpm with ${SETUP_ACTION}`,
      );
    }
  }

  if (/\bpnpm\b/.test(source) && !SETUP_USES.test(source)) {
    errors.push(
      `${rel}: jobs that run pnpm must use ${SETUP_ACTION} so Node/pnpm match mise`,
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
