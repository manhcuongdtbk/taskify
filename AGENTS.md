<!-- BEGIN:project-docs -->

## Project docs

Concern maps, TODOs, out of scope: start at [`docs/README.md`](docs/README.md).

### One tool per job (hard rule)

Choose a tool carefully for a given purpose. Once adopted, **do not add another tool for the same purpose** (no parallel stacks). **Replace** only if the candidate can do **everything (or nearly everything) it does, better** — [`docs/conventions.md`](docs/conventions.md#when-a-replacement-is-justified). Testing examples (Vitest / Playwright / Storybook): [`docs/testing.md`](docs/testing.md#what-to-test-where). Full rule: [`docs/conventions.md`](docs/conventions.md#one-tool-per-job) · [`docs/vocabulary.md`](docs/vocabulary.md#one-tool-per-job).

### Match installed official docs (hard rule)

**Do not trust training data or random blog posts for APIs.** For every dependency you touch, use official docs that match the **installed version** in `package.json` / `node_modules/<pkg>/package.json`. Procedure + per-package how-to: [`docs/conventions.md`](docs/conventions.md#match-installed-official-docs). Repo concern docs (`docs/*.md`) are **our wiring** — not a substitute for that library’s versioned docs. **Do not** dump every library’s “best practices” into this file — put overrides in the concern doc; add a bullet here only for **high-drift** defaults ([Official guidance vs our wiring](docs/conventions.md#official-guidance-vs-our-wiring)).

### pnpm store (hard rule)

Use pnpm’s **default global** store. Never create or commit a project-local `.pnpm-store/`. For `pnpm add` / `install` / `update` / `remove`, run the shell **outside** the Cursor sandbox so the global store is writable — details: [`docs/conventions.md`](docs/conventions.md) (pnpm store / agents) · `.cursor/rules/pnpm.mdc`.
<!-- END:project-docs -->

<!-- BEGIN:prisma -->

# This is NOT the Prisma typing you know from blogs

Training data often hand-writes `Card & { list: List }`. **Don’t.** Official pattern (verify for installed major): `satisfies Prisma.*DefaultArgs` + `*GetPayload`. **SoT for our wiring:** [`docs/prisma.md`](docs/prisma.md) · shared shapes in [`lib/prisma/query-options/<model>.ts`](lib/prisma/query-options/card.ts) (e.g. `card.ts`, `list.ts`) — shapes only, not `find*`/`create*`. Match installed Prisma — [`conventions.md` Match installed table](docs/conventions.md#match-installed-official-docs) (Prisma row). Cursor rule: `.cursor/rules/prisma.mdc`.

<!-- END:prisma -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vitest -->

# This is NOT the Vitest you know

APIs and defaults may differ from training data (Vitest 3 vs 4). Match the installed version — [`docs/conventions.md` → Match installed official docs](docs/conventions.md#match-installed-official-docs) (Vitest row). Vitest does **not** ship docs in `node_modules` (unlike Next).

## Vitest (repo rules)

**SoT:** [`docs/testing.md`](docs/testing.md) — harness, scripts, **[what to test where](docs/testing.md#what-to-test-where)** (Vitest / Playwright / Storybook), **[decision record](docs/testing.md#decision-record-vitest--jsdom--browser-mode--playwright--storybook)** (jsdom default vs Browser Mode / Storybook — don’t re-litigate). Colocation mid-suffixes: [`docs/conventions.md`](docs/conventions.md). Folders (`e2e/`): [`docs/project-structure.md`](docs/project-structure.md).

- **Run:** `pnpm test:run` (agents/CI) · `pnpm test` (watch) · `pnpm test:coverage` — never leave watch hanging in agent sessions.
- **Imports:** `import { describe, expect, test, vi } from "vitest"` — no `globals`; `vi.*` only (**not** `jest.*`).
- **File suffixes / layout:** `*.test.*` = Vitest colocated (never `__tests__/`, `tests/`, or root `test/`); **match the source extension** (`foo.ts` → `foo.test.ts`, `foo.tsx` → `foo.test.tsx` — `.tsx` only when the suite has JSX); `e2e/*.spec.*` = Playwright only — never mix. See [`docs/testing.md`](docs/testing.md).
- **Terms / naming:** use Vitest’s **test name** (not “title”); follow naming guidance in [`docs/testing.md`](docs/testing.md).
- **Component env:** default **jsdom** + Testing Library — **not** Vitest Browser Mode unless [`testing.md` triggers](docs/testing.md#trigger-checklist-for-switching-the-component-default) say so (Vitest’s component guide prefers Browser Mode; our wiring wins).
- **HTTP mocks:** Query/`fetcher` UI → **MSW** via [`lib/testing/msw/`](lib/testing/msw/) (lifecycle in `vitest.setup.ts`). Match installed `msw` — [`conventions.md` Match installed table](docs/conventions.md#match-installed-official-docs) (MSW row). **Our wiring** (no top-level `mocks/`, `server.use`, assert UI not requests, Unsplash stays SDK mock for now): [`docs/testing.md` → MSW in this repo](docs/testing.md#msw-in-this-repo). Don’t invent a parallel fetch-mock stack.
- **Entity test data:** repeating Prisma-shaped objects → **Fishery** under [`lib/testing/factories/`](lib/testing/factories/) — **one file per entity** (`list.ts`, `card.ts`, `audit-log.ts`). Match installed `fishery` — [`conventions.md` Match installed table](docs/conventions.md#match-installed-official-docs). **Our wiring:** [`testing.md` → Fishery practices](docs/testing.md#fishery-practices) — never nest another entity’s factory in a sibling file; `sequence` ids; build **inside each test** (ESLint); associations + `afterBuild` for FKs; assert built fields; don’t hand-roll `make*` or confuse with Vitest `test.extend` fixtures.
- **Bug fixes:** for Vitest-owned code, write a **failing** regression test first, then fix the implementation — don’t weaken the test to make it pass. Details: [`docs/testing.md`](docs/testing.md) · [Vitest: Fixing Bugs with Tests](https://vitest.dev/guide/learn/testing-in-practice.html#fixing-bugs-with-tests).
- **Expect order:** after the act, `expect(…)` must follow **execution order** (calls/side effects → result). Hard rule: [`docs/testing.md`](docs/testing.md).
- **Mocks / files / scope / Storybook:** follow [`docs/testing.md`](docs/testing.md) — don’t invent Jest, Cypress, or Storybook-as-CI-test-runner.

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
