<!-- BEGIN:project-docs -->

## Project docs

Concern maps, TODOs, out of scope: start at [`docs/README.md`](docs/README.md).

### One tool per job (hard rule)

Choose a tool carefully for a given purpose. Once adopted, **do not add another tool for the same purpose** (no parallel stacks). **Replace** the current tool only if the candidate can do **everything (or nearly everything) it does, better** — see justified reasons in [`docs/conventions.md`](docs/conventions.md#when-a-replacement-is-justified); document the swap in the matching concern doc. Examples today: Vitest (not Jest) for unit/component; Playwright (not Cypress) for E2E; TanStack Query (not SWR); es-toolkit (not Lodash). Details: [`docs/conventions.md`](docs/conventions.md#one-tool-per-job) · [`docs/vocabulary.md`](docs/vocabulary.md#one-tool-per-job).

### Match installed official docs (hard rule)

**Do not trust training data or random blog posts for APIs.** For every dependency you touch, use official docs that match the **installed version** in `package.json` / `node_modules/<pkg>/package.json`. Procedure + per-package how-to: [`docs/conventions.md`](docs/conventions.md#match-installed-official-docs). Repo concern docs (`docs/*.md`) are **our wiring** — not a substitute for that library’s versioned docs.
<!-- END:project-docs -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vitest -->

# This is NOT the Vitest you know

APIs and defaults may differ from training data (Vitest 3 vs 4). Follow **[Match installed official docs](docs/conventions.md#match-installed-official-docs)** — check `package.json` / `node_modules/vitest/package.json`, then [vitest.dev](https://vitest.dev) / matching git tag under [vitest-dev/vitest `docs/`](https://github.com/vitest-dev/vitest/tree/main/docs). Vitest does **not** ship docs in `node_modules` (unlike Next).

**Jest is not used in this repo and will not be added** (no Jest runner, no `jest.*` APIs). Models often emit `jest.fn` / `jest.mock` from training data — always use `vi.*` from `vitest` instead.

## Vitest (repo rules)

Full setup map: [`docs/testing.md`](docs/testing.md). Colocation: [`docs/conventions.md`](docs/conventions.md). Official AI tips: [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html).

- **Run:** `pnpm test:run` (or `vitest run`) — never leave watch mode hanging in agent/CI sessions. `pnpm test` is interactive watch for humans. Coverage: `pnpm test:coverage`.
- **Imports:** always `import { describe, expect, test, vi } from "vitest"` — `globals` are off. Use `vi.fn` / `vi.mock` only.
- **Mocks:** prefer `vi.mock(import("./module"))` over string paths; assert behavior, don’t over-mock. `restoreMocks` is on in config.
- **Files:** colocated `*.test.ts` / `*.test.tsx` next to the module (not a catch-all `tests/` tree). Short behavior-focused names.
- **Scope:** pure `lib/` + Zod schemas + client components. Async Server Components / full Server Actions + Clerk + Prisma → **Playwright** E2E later (not Vitest). **Playwright is the only E2E tool** — Cypress and other E2E runners are never used.

<!-- END:vitest -->

<!-- VERCEL BEST PRACTICES START -->

## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access

<!-- VERCEL BEST PRACTICES END -->
