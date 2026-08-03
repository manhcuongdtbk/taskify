# Testing

Unit / component tests and (later) E2E. Where the harness lives, how to run and debug it, and what belongs in Vitest vs Playwright.

|                 |                                                                                         |
| --------------- | --------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — Vitest setup map, run/debug, what to test where                             |
| **Open when**   | Adding a test, changing Vitest config/scripts, debugging a failing suite, or onboarding |

**Implementation today:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (jsdom). Catalog picks: [`conventions.md`](./conventions.md). Index: [`README.md`](./README.md). Agents: [`AGENTS.md`](../AGENTS.md) (Vitest section).

### Official docs (match installed version)

Vitest does **not** ship guides under `node_modules` (Next does). Before relying on API trivia:

1. Read the installed version: `package.json` → `vitest`, or `node_modules/vitest/package.json`.
2. Prefer [vitest.dev](https://vitest.dev) for the **current major** (this repo is Vitest **4**). Older majors live on versioned hosts (e.g. [v3.vitest.dev](https://v3.vitest.dev)) — don’t mix them.
3. For a **exact** guide snapshot, use the git tag: `https://github.com/vitest-dev/vitest/tree/v{version}/docs` (replace `{version}` with the installed one, e.g. `v4.1.10`).
4. Next wiring: [Next.js + Vitest](https://nextjs.org/docs/app/guides/testing/vitest) for the Next version in `package.json` (also see `node_modules/next/dist/docs/`).
5. AI-oriented official tips: [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [Debugging](https://vitest.dev/guide/debugging.html).

This page is **our** wiring and common practices. Testing instantiates the repo hard rule **[one tool per job](./vocabulary.md#one-tool-per-job)** ([`conventions.md`](./conventions.md#one-tool-per-job)):

- **Unit / component:** Vitest only — **Jest** is never used. Models often emit `jest.*` from training data; use `vi.*` from `vitest` only.
- **E2E:** Playwright only (when added) — **Cypress** and other E2E runners are never used.
- Don’t invent a second unit or E2E runner beside those unless it is a true **replacement** that dominates (same rule).

## Already following

- Vitest + `@vitejs/plugin-react` + jsdom + Testing Library (`@testing-library/react`, `@testing-library/dom`)
- Config: [`vitest.config.mts`](../vitest.config.mts) — `environment: "jsdom"`, `restoreMocks: true`, `vite-tsconfig-paths` for `@/*`
- Scripts: `pnpm test` (watch), `pnpm test:run` (CI/agents), `pnpm test:inspect` (Chrome DevTools / Node inspector)
- VS Code: recommend `vitest.explorer`; launch configs in [`.vscode/launch.json`](../.vscode/launch.json)
- Colocated `*.test.ts` / `*.test.tsx` (prefer `.test` over `.spec`) — [`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md)
- Explicit Vitest imports (no `globals`); `vi.*` only (Jest is never used here)

## TODO

- [ ] First colocated suite(s) — start with pure `lib/` / Zod `actions/*/schema.ts`, then a client component
- [ ] `@testing-library/jest-dom` + `setupFiles` when component assertions need `toBeInTheDocument()` etc. (DOM matchers only — **not** the Jest test runner)
- [ ] `@testing-library/user-event` when writing interactive component tests
- [ ] Drop `vite-tsconfig-paths` for Vite native `resolve.tsconfigPaths` if the deprecation warning stays noisy
- [ ] Exclude `e2e/` from Vitest when Playwright lands (often `*.spec.ts`)
- [ ] MSW when a Query-backed UI needs HTTP mocks — [`conventions.md`](./conventions.md)
- [ ] Playwright for critical flows (auth, board, billing) — keep under `e2e/` (only E2E tool; no Cypress)
- [ ] CI: run `pnpm test:run` on PRs when suites exist

## Out of scope for now

- **Jest** (runner or `jest.*` APIs) — forever out of scope; Vitest only for unit/component
- **Cypress** and any other E2E runner beside Playwright — forever out of scope
- Vitest Browser Mode (we use jsdom for component tests)
- Catch-all `tests/` tree — colocate unit/component; `e2e/` for Playwright
- Async Server Components in Vitest — use Playwright E2E ([Next.js note](https://nextjs.org/docs/app/guides/testing/vitest))

## What to test where

| Kind                              | Tool                                                  | Examples                                         |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Unit                              | Vitest                                                | Zod schemas, `lib/*` helpers                     |
| Component (static or interactive) | Vitest + Testing Library (+ `user-event` when needed) | Client forms, modal pieces — props inline in JSX |
| HTTP-backed client UI             | Vitest + MSW (when needed)                            | TanStack Query components                        |
| Critical user flows / async RSC   | Playwright                                            | Sign-in → board → card → Pro                     |

jsdom is **not** a real browser: programmatic DOM + synthetic events. Layout, real Clerk/Stripe UI, and full navigation → Playwright.

## Run

| Script              | When                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`         | Local watch (humans)                                                                                                                          |
| `pnpm test:run`     | One-shot — agents, CI, pre-commit checks                                                                                                      |
| `pnpm test:inspect` | Pause for Chrome DevTools (`chrome://inspect`) — [Node inspector](https://vitest.dev/guide/debugging.html#node-inspector-e-g-chrome-devtools) |

## Debug

1. **Preferred:** Testing view → **Debug Test** (`vitest.explorer`)
2. **F5 / Debug panel:** configs in [`.vscode/launch.json`](../.vscode/launch.json) — current file, current file (watch), all tests (`--test-timeout=0`, `--no-file-parallelism`)
3. **JavaScript Debug Terminal** + `pnpm test` — zero config
4. **`pnpm test:inspect`** + `chrome://inspect` — IDE-optional

## File map

| Path                                                    | Role                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| [`vitest.config.mts`](../vitest.config.mts)             | Vitest + React plugin + jsdom + `restoreMocks`               |
| [`package.json`](../package.json)                       | `test` / `test:run` / `test:inspect`                         |
| [`.vscode/extensions.json`](../.vscode/extensions.json) | `vitest.explorer`                                            |
| [`.vscode/launch.json`](../.vscode/launch.json)         | Vitest debug launch configs                                  |
| [`AGENTS.md`](../AGENTS.md)                             | Short agent rules (point here for the full map)              |
| `**/foo.test.ts(x)`                                     | Colocated suites (none required yet; add next to the module) |
| `e2e/`                                                  | Playwright only (when added)                                 |
