# Testing

Unit / component tests, E2E, and (later) Storybook. Where each tool’s **job** starts and stops — so we don’t duplicate the same assertions in three places.

|                 |                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — Vitest setup map, run/debug, **what to test where** (Vitest / Playwright / Storybook)       |
| **Open when**   | Choosing a **test type** / tool, adding a test or story, or changing Vitest/Playwright/Storybook config |

**Implementation today:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (jsdom). **When needed:** [Playwright](https://playwright.dev) (E2E), [Storybook](https://storybook.js.org) (UI catalog). Catalog picks: [`conventions.md`](./conventions.md). Index: [`README.md`](./README.md). Agents: [`AGENTS.md`](../AGENTS.md) (Vitest section).

### Official docs (match installed version)

Same hard rule as the rest of the stack — [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs) · [`AGENTS.md`](../AGENTS.md).

For Vitest specifically:

1. Read the installed version: `package.json` → `vitest`, or `node_modules/vitest/package.json`.
2. Prefer [vitest.dev](https://vitest.dev) for the **current major** (this repo is Vitest **4**). Older majors live on versioned hosts (e.g. [v3.vitest.dev](https://v3.vitest.dev)) — don’t mix them.
3. For an **exact** guide snapshot, use the git tag: `https://github.com/vitest-dev/vitest/tree/v{version}/docs` (replace `{version}` with the installed one).
4. Next wiring: [Next.js + Vitest](https://nextjs.org/docs/app/guides/testing/vitest) for the Next version in `package.json` (also see `node_modules/next/dist/docs/`).
5. AI-oriented official tips: [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [Debugging](https://vitest.dev/guide/debugging.html) · [Coverage](https://vitest.dev/guide/coverage.html).

This page is **our** wiring and common practices. Testing instantiates the repo hard rule **[one tool per job](./vocabulary.md#one-tool-per-job)** ([`conventions.md`](./conventions.md#one-tool-per-job)):

- **Unit / component behavior:** Vitest only — **Jest** is never used. Models often emit `jest.*` from training data; use `vi.*` from `vitest` only.
- **E2E / product journeys:** Playwright only (when added) — **Cypress** and other E2E runners are never used.
- **UI catalog / workshop (later):** Storybook only when its [triggers](#storybook-when-needed) pass — not a second Vitest or Playwright. Don’t invent Storybook early “for tests.”
- Don’t invent a second unit or E2E runner beside Vitest/Playwright unless it is a true **replacement** that dominates (same rule).

## Already following

- Vitest + `@vitejs/plugin-react` + jsdom + Testing Library (`@testing-library/react`, `@testing-library/dom`)
- Config: [`vitest.config.mts`](../vitest.config.mts) — `environment: "jsdom"`, `restoreMocks: true`, `coverage.provider: "v8"`, `vite-tsconfig-paths` for `@/*`
- Scripts: `pnpm test` (watch), `pnpm test:run` (CI/agents), `pnpm test:coverage` (`vitest run --coverage`), `pnpm test:inspect` (Chrome DevTools / Node inspector)
- Coverage: `@vitest/coverage-v8` — [Coverage](https://vitest.dev/guide/coverage.html); reports under `coverage/` (gitignored)
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
- [ ] Storybook when [triggers](#storybook-when-needed) pass — catalog/workshop only; colocated `*.stories.tsx`
- [ ] CI: run `pnpm test:run` (and optionally `pnpm test:coverage`) on PRs when suites exist
- [ ] `@vitest/ui` (`vitest --ui` / optional `html` reporter) when browser suite exploration or CI HTML reports beat the VS Code Testing view — [Vitest UI](https://vitest.dev/guide/ui.html)
- [ ] Tighten `coverage.include` / thresholds once suites exist and the report is noisy

## Out of scope for now

- **Jest** (runner or `jest.*` APIs) — forever out of scope; Vitest only for unit/component
- **Cypress** and any other E2E runner beside Playwright — forever out of scope
- **Storybook as a test runner** — until added, Vitest/Playwright own verification; after add, don’t duplicate the same CI assertions in stories
- Vitest Browser Mode (we use jsdom for component tests)
- Catch-all `tests/` tree — colocate unit/component; `e2e/` for Playwright
- Async Server Components in Vitest — use Playwright E2E ([Next.js note](https://nextjs.org/docs/app/guides/testing/vitest))

## What to test where

The confusing part is **test type** (what you are verifying) vs **tool** (what runs it). Same-looking checks can live in Vitest, Playwright, or Storybook — this repo picks **one owner per type** ([one tool per job](./vocabulary.md#one-tool-per-job)).

Until Storybook exists, **Vitest + Playwright cover all automated verification**. Storybook later adds a **catalog/workshop** job, not a second place for the same CI assertions.

### Decide in order

Ask top → bottom; stop at the first yes:

1. **Needs the real running app?** (Clerk session, real routes, async RSC, Stripe Checkout UI, multi-page navigation, real cookies) → **Playwright** (`e2e/`).
2. **Pure logic — no React tree?** (Zod schema, `lib/*` helper, money/path formatting) → **Vitest unit** (`*.test.ts`).
3. **One client component / hook — assert behavior?** (render, click, type, empty/error UI as DOM assertions) → **Vitest component** (`*.test.tsx` + Testing Library).
4. **Client UI that talks HTTP via Query?** → still **Vitest**, mock HTTP with **MSW** when needed (not Playwright).
5. **Humans need a browsable gallery of UI variants?** → **Storybook** only when [triggers](#storybook-when-needed) pass — not for CI assertions of the same behavior.
6. **Pixel / screenshot diff?** → **Playwright** until a Storybook visual workshop is deliberately adopted (then pick **one** visual system).

```text
Needs full app / real browser product? ──yes──► Playwright
         │ no
Pure function / schema? ──yes──► Vitest unit
         │ no
Component or hook behavior? ──yes──► Vitest (+ MSW if HTTP)
         │ no
Catalog for humans? ──yes──► Storybook (when triggered)
         │ no
Visual regression only? ──yes──► Playwright (for now)
```

### Test types (vocabulary)

| Test type                   | What you are checking                                        | Runs in                  | **Tool here**                                                                        | Typical files                | Taskify examples                                                                       |
| --------------------------- | ------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------- |
| **Unit**                    | One function/module in isolation — inputs → outputs / throws | Node (Vitest)            | **Vitest**                                                                           | `foo.test.ts` next to module | `actions/*/schema.ts`, `lib/fetcher.ts`, `lib/paths.ts`, `lib/generate-log-message.ts` |
| **Component (static)**      | Given props, the right roles/text/structure appear           | jsdom                    | **Vitest** + Testing Library                                                         | `foo.test.tsx`               | Modal header title, disabled submit, empty list copy                                   |
| **Component (interactive)** | User events change UI or call callbacks                      | jsdom + synthetic events | **Vitest** + Testing Library + `user-event`                                          | `foo.test.tsx`               | Type board title, open/close modal via store, toggle sidebar                           |
| **Component + HTTP**        | Query/UI with mocked network (not the real API)              | jsdom + MSW              | **Vitest** + MSW                                                                     | `foo.test.tsx`               | Card modal fetch success/error with MSW handlers                                       |
| **E2E (end-to-end)**        | A real user journey through the deployed/dev app             | Real browser             | **Playwright**                                                                       | `e2e/*.ts`                   | Sign-in → create board → add card → open billing                                       |
| **Visual regression**       | Pixels / layout look unchanged (or intentionally changed)    | Real browser             | **Playwright** screenshots **for now**; Storybook/Chromatic only if workshop trigger | `e2e/` or later stories      | Optional smoke screenshot of board canvas                                              |
| **Accessibility checks**    | Axe/roles issues on a unit of UI or a page                   | jsdom and/or browser     | Prefer **Vitest** for isolated components; **Playwright** for full pages             | colocated or `e2e/`          | Form missing label; dashboard a11y smoke                                               |
| **Story / catalog**         | Document and browse UI states for humans                     | Storybook app            | **Storybook** (when needed)                                                          | `foo.stories.tsx`            | All `CardModal` variants side by side — **not** a duplicate of the Vitest suite        |

**Not separate runners here:** “integration” is overloaded. A Vitest test that renders a component with MSW is still **Vitest** (component + HTTP). We do **not** add a third harness named integration.

### Static vs interactive (both Vitest)

|           | Static component test               | Interactive component test              |
| --------- | ----------------------------------- | --------------------------------------- |
| Acts like | Snapshot of the tree after `render` | User clicking/typing                    |
| Assert    | Roles, text, attributes             | Outcomes after `userEvent`              |
| Use when  | Props → markup                      | Behavior matters                        |
| Still     | Vitest + Testing Library            | Vitest + Testing Library + `user-event` |

jsdom is **not** a real browser: no real layout engine, incomplete Web APIs. If the bug is “dnd geometry,” “Clerk hosted UI,” or “RSC stream on this route,” that is **Playwright**, not a harder Vitest test.

### Overlap traps (pick one owner)

| Tempting duplicate                                                   | Keep                                                                               | Drop                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Same button toggle asserted in Vitest **and** Playwright             | Vitest for the component; Playwright only inside a **journey** if the flow matters | Playwright-only click of that button with no product context |
| Empty/error **behavior** in Vitest **and** a Storybook `play` assert | Vitest                                                                             | Storybook `play` as CI assert for the same thing             |
| Full sign-in flow in Vitest with mocks **and** Playwright            | Playwright                                                                         | Fake “E2E” in jsdom                                          |
| Screenshot in Playwright **and** Chromatic for the same surface      | Choose **one** visual system when both exist                                       | Both forever                                                 |

### Mental model

```text
Vitest      →  “Does the code behave correctly?”     (unit + component assert ± MSW)
Playwright  →  “Does the product work end-to-end?”   (real app + real browser)
Storybook   →  “Can humans browse / compose UI?”    (catalog — when triggered)
```

### Storybook (when needed)

**Not** a Vitest or Playwright replacement. Add only when triggers pass — prefer [Storybook](https://storybook.js.org) over Ladle/Histoire ([`conventions.md`](./conventions.md)).

**Triggers (any one is enough):**

- Design/review needs a **browsable catalog** of UI variants without booting the full app
- Handing a **design system / shared UI** set to others (docs + isolated playground)
- A deliberate **visual workshop** workflow (e.g. Chromatic) that Storybook fits better than Playwright screenshots alone

**When added:**

- Colocate `*.stories.tsx` next to the component ([`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md))
- Own **catalog / workshop / human review** — stories may _demo_ interactions; **CI assertions for the same behavior stay in Vitest** (and journeys in Playwright)
- Don’t maintain two assertion suites for one outcome ([one tool per job](./vocabulary.md#one-tool-per-job))
- Optional later: Storybook’s Vitest/browser addons — only with an explicit decision; default remains colocated Vitest `*.test.tsx` for behavior

## Run

| Script               | When                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`          | Local watch (humans)                                                                                                                          |
| `pnpm test:run`      | One-shot — agents, CI, pre-commit checks                                                                                                      |
| `pnpm test:coverage` | One-shot with V8 coverage report (`coverage/`) — [Coverage](https://vitest.dev/guide/coverage.html)                                           |
| `pnpm test:inspect`  | Pause for Chrome DevTools (`chrome://inspect`) — [Node inspector](https://vitest.dev/guide/debugging.html#node-inspector-e-g-chrome-devtools) |

## Debug

1. **Preferred:** Testing view → **Debug Test** (`vitest.explorer`)
2. **F5 / Debug panel:** configs in [`.vscode/launch.json`](../.vscode/launch.json) — current file, current file (watch), all tests (`--test-timeout=0`, `--no-file-parallelism`)
3. **JavaScript Debug Terminal** + `pnpm test` — zero config
4. **`pnpm test:inspect`** + `chrome://inspect` — IDE-optional

## File map

| Path                                                    | Role                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| [`vitest.config.mts`](../vitest.config.mts)             | Vitest + React plugin + jsdom + `restoreMocks` + V8 coverage |
| [`package.json`](../package.json)                       | `test` / `test:run` / `test:coverage` / `test:inspect`       |
| [`.vscode/extensions.json`](../.vscode/extensions.json) | `vitest.explorer`                                            |
| [`.vscode/launch.json`](../.vscode/launch.json)         | Vitest debug launch configs                                  |
| [`AGENTS.md`](../AGENTS.md)                             | Short agent rules (point here for the full map)              |
| `**/foo.test.ts(x)`                                     | Colocated suites (none required yet; add next to the module) |
| `e2e/`                                                  | Playwright only (when added)                                 |
