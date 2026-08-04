# Testing

Unit / component tests, E2E, and (later) Storybook. Where each tool’s **job** starts and stops — so we don’t duplicate the same assertions in three places.

|                 |                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — Vitest setup map, run/debug, **what to test where** (Vitest / Playwright / Storybook)       |
| **Open when**   | Choosing a **test type** / tool, adding a test or story, or changing Vitest/Playwright/Storybook config |

**Implementation today:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (jsdom). **When needed:** [Playwright](https://playwright.dev) (E2E), [Storybook](https://storybook.js.org) (UI catalog). Index: [`README.md`](./README.md). Agents: [`AGENTS.md`](../AGENTS.md).

**Doc ownership (keep DRY):**

| Concern                                                                          | SoT file                                                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Test **type** → which **tool** · harness · scripts · Storybook triggers          | **This file**                                                                                      |
| Mid-suffix companions (`*.test.tsx`, `*.stories.tsx`) · props-in-JSX             | [`conventions.md`](./conventions.md#companion-files-role-mid-suffixes-vs-bare-names)               |
| Folders (`e2e/`, avoid `tests/`, `fixtures/`)                                    | [`project-structure.md`](./project-structure.md)                                                   |
| Catalog status (Adopted / When needed) for Vitest / Playwright / MSW / Storybook | [`conventions.md`](./conventions.md) tooling rows → link here for detail                           |
| Version-matched official docs                                                    | [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs) |

### Official docs (match installed version)

Follow [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs) (Vitest / Testing Library / Playwright rows). Next + Vitest wiring: [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) for the Next version in `package.json`. Handy Vitest pages: [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html) · [Debugging](https://vitest.dev/guide/debugging.html) · [Coverage](https://vitest.dev/guide/coverage.html).

This page is **our** wiring. Tool exclusivity ([one tool per job](./vocabulary.md#one-tool-per-job)):

- **Unit / component behavior:** Vitest only — never Jest (`vi.*`, not `jest.*`)
- **E2E:** Playwright only when added — never Cypress
- **UI catalog:** Storybook only when [triggers](#storybook-when-needed) pass — not a second test runner

## Already following

- Vitest + `@vitejs/plugin-react` + jsdom + Testing Library (`@testing-library/react`, `@testing-library/dom`)
- Config: [`vitest.config.mts`](../vitest.config.mts) — `environment: "jsdom"`, `restoreMocks: true`, `expect.requireAssertions: true`, `coverage.provider: "v8"`, `vite-tsconfig-paths` for `@/*`
- Scripts: `pnpm test` (watch), `pnpm test:run` (CI/agents), `pnpm test:coverage` (`vitest run --coverage`), `pnpm test:inspect` (Chrome DevTools / Node inspector)
- Coverage: `@vitest/coverage-v8` — [Coverage](https://vitest.dev/guide/coverage.html); reports under `coverage/` (gitignored)
- VS Code: recommend `vitest.explorer`; launch configs in [`.vscode/launch.json`](../.vscode/launch.json)
- Colocated `*.test.ts` / `*.test.tsx` (**Vitest only**; never `*.spec.*`) — [`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md)
- Explicit Vitest imports (no `globals`); `vi.*` only (Jest is never used here)
- ESLint: [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) on `**/*.test.{ts,tsx}` — `recommended` + repo extras; rationale in [Vitest lint & config choices](#vitest-lint--config-choices) · [`eslint.config.mjs`](../eslint.config.mjs)
- Suffix split: `*.test.*` = Vitest (colocated only — no `__tests__/` / `tests/` / root `test/`), `e2e/*.spec.*` = Playwright — [enforced](#vitest-lint--config-choices)
- Bug fixes: [reproduce with a failing test first](#fixing-bugs-with-tests-agents)

### Fixing bugs with tests (agents)

When fixing a bug in code that Vitest owns ([what to test where](#what-to-test-where)):

1. Write a **failing** colocated test that reproduces the bug.
2. Fix the **implementation** (not the test) until the test passes.
3. Keep the test as a regression guard.

Do **not** “fix” by weakening assertions or deleting the repro. Prefer real behavior over mocks unless the dependency is slow/flaky/side-effectful ([Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html#fixing-bugs-with-tests)).

If the bug needs the real app (Clerk, Stripe Checkout UI, async RSC, multi-page flows), use Playwright when added — don’t force a Vitest suite for that class of bug.

### Vitest lint & config choices

Why we set these (not just what). Enforcement lives in [`vitest.config.mts`](../vitest.config.mts) and [`eslint.config.mjs`](../eslint.config.mjs). Prefer official docs for the installed Vitest / plugin versions ([`conventions.md`](./conventions.md)).

| Choice                                                                  | Why                                                                                                                              | Reference                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restoreMocks: true`                                                    | Spies/mocks (especially AI-written) often skip cleanup; restore between tests                                                    | [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)                                                                                                                                           |
| `expect.requireAssertions: true`                                        | Runtime fail if a test never calls Vitest `expect` (empty / accidental pass)                                                     | [expect.requireAssertions](https://vitest.dev/config/expect.html#expect-requireassertions)                                                                                                                                   |
| ESLint `recommended` (not `all`)                                        | Correctness / anti-footgun baseline. `all` is mostly style, padding (Prettier’s job), and downgrades many rules to `warn`        | [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) shareable configs                                                                                                                              |
| Vitest `include` = `*.test.*` only; exclude `e2e/`                      | Vitest must not pick up Playwright files (both tools accept `.test` and `.spec` by default)                                      | [include](https://vitest.dev/config/include.html) · [Playwright testMatch](https://playwright.dev/docs/api/class-testconfig#test-config-test-match)                                                                          |
| ESLint Vitest rules on `**/*.test.{ts,tsx}` only                        | Don’t lint Playwright specs as Vitest                                                                                            | [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest)                                                                                                                                                |
| Ban `*.spec.*` outside `e2e/`; ban `*.test.*` inside `e2e/`             | Hard suffix split: Vitest ↔ Playwright                                                                                           | [`eslint.config.mjs`](../eslint.config.mjs)                                                                                                                                                                                  |
| Ban Vitest separate suite folders: `__tests__/`, `tests/`, root `test/` | Vitest docs allow these; we colocate only. Nested `test/` left alone (may be an App Router segment). Not `__mocks__` (mock dirs) | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html#organizing-test-files) · [`project-structure.md`](./project-structure.md) |
| Ban `@playwright/test` in `*.test.*`; ban `vitest` in `e2e/*.spec.*`    | Wrong runner import is a smell even before Playwright lands                                                                      | [`eslint.config.mjs`](../eslint.config.mjs)                                                                                                                                                                                  |
| `consistent-test-it` → `test`                                           | Vitest guides lead with `test`; `it` is an identical alias — pick one                                                            | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-test-it.md)                                                   |
| `consistent-vitest-vi` → `vi`                                           | Docs document the helper as `vi.*`; `vitest` is the same object under another name                                               | [Vi API](https://vitest.dev/api/vi.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-vitest-vi.md)                                                                           |
| `prefer-importing-vitest-globals`                                       | We do **not** enable Vitest `globals`; always `import { … } from "vitest"`                                                       | [Using Global Imports](https://vitest.dev/guide/learn/writing-tests.html#using-global-imports) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-importing-vitest-globals.md)          |
| `consistent-each-for`                                                   | Prefer `test.for` over Jest-style `test.each` in new code                                                                        | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-each-for.md)                                                  |
| `hoisted-apis-on-top`                                                   | `vi.mock` / `vi.hoisted` are hoisted — keep them at the top of the file                                                          | [vi.mock](https://vitest.dev/api/vi.html#vi-mock) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/hoisted-apis-on-top.md)                                                                   |
| `no-alias-methods`                                                      | Prefer full matcher names (`toHaveBeenCalled`) over aliases (`toBeCalled`)                                                       | [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-alias-methods.md)                                                                                                                          |
| `no-test-prefixes`                                                      | Prefer `.only` / `.skip` over `f` / `x` prefixes                                                                                 | [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-test-prefixes.md)                                                                                                                          |
| `prefer-hooks-on-top` · `prefer-hooks-in-order` · `no-duplicate-hooks`  | Stable setup/teardown layout; no accidental double hooks                                                                         | [rules](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules)                                                                                                                                             |
| `max-nested-describe` (`max: 3`)                                        | Keep `describe` nesting shallow                                                                                                  | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/max-nested-describe.md)                                                  |
| **Skip** `prefer-expect-assertions`                                     | Runtime `requireAssertions` already covers “must assert”; no need for ceremonial `expect.hasAssertions()`                        | [expect.requireAssertions](https://vitest.dev/config/expect.html#expect-requireassertions)                                                                                                                                   |
| **Skip** `padding-around-*` / most of `all`                             | Prettier owns formatting; avoid a second style guide                                                                             | [`conventions.md`](./conventions.md) (lint & format) · plugin `all` config                                                                                                                                                   |

`recommended` already includes `expect-expect` (lint-time “has an assertion”) alongside runtime `requireAssertions` — complementary, not duplicate tooling.

## TODO

- [ ] First colocated suite(s) — start with pure `lib/` / Zod `actions/*/schema.ts`, then a client component
- [ ] `@testing-library/jest-dom` + `setupFiles` when component assertions need `toBeInTheDocument()` etc. (DOM matchers only — **not** the Jest test runner)
- [ ] `@testing-library/user-event` when writing interactive component tests
- [ ] Drop `vite-tsconfig-paths` for Vite native `resolve.tsconfigPaths` if the deprecation warning stays noisy
- [ ] MSW when a Query-backed UI needs HTTP mocks — [`conventions.md`](./conventions.md)
- [ ] Playwright for critical flows (auth, board, billing) — `e2e/*.spec.ts` only (never `*.test.*`; only E2E tool; no Cypress)
- [ ] Storybook when [triggers](#storybook-when-needed) pass — catalog/workshop only; colocated `*.stories.tsx`
- [ ] CI: run `pnpm test:run` (and optionally `pnpm test:coverage`) on PRs when suites exist
- [ ] `@vitest/ui` (`vitest --ui` / optional `html` reporter) when browser suite exploration or CI HTML reports beat the VS Code Testing view — [Vitest UI](https://vitest.dev/guide/ui.html)
- [ ] Tighten `coverage.include` / thresholds once suites exist and the report is noisy

## Out of scope for now

- **Jest** (runner or `jest.*` APIs) — forever out of scope; Vitest only for unit/component
- **Cypress** and any other E2E runner beside Playwright — forever out of scope
- **Storybook as a test runner** — until added, Vitest/Playwright own verification; after add, don’t duplicate the same CI assertions in stories
- Vitest Browser Mode (we use jsdom for component tests)
- Catch-all Vitest trees (`tests/`, `__tests__/`, root `test/`) — colocate `*.test.*`; `e2e/` for Playwright
- Async Server Components in Vitest — use Playwright E2E ([Next.js note](https://nextjs.org/docs/app/guides/testing/vitest))

## What to test where

The confusing part is **test type** (what you are verifying) vs **tool** (what runs it). Same-looking checks can live in Vitest, Playwright, or Storybook — this repo picks **one owner per type** ([one tool per job](./vocabulary.md#one-tool-per-job)).

Until Storybook exists, **Vitest + Playwright cover all automated verification**. Storybook later adds a **catalog/workshop** job, not a second place for the same CI assertions.

### Decide in order

Ask top → bottom; stop at the first yes:

1. **Needs the real running app?** (Clerk session, real routes, async RSC, Stripe Checkout UI, multi-page navigation, real cookies) → **Playwright** (`e2e/*.spec.ts`).
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
| **E2E (end-to-end)**        | A real user journey through the deployed/dev app             | Real browser             | **Playwright**                                                                       | `e2e/*.spec.ts`              | Sign-in → create board → add card → open billing                                       |
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

| Path                                                    | Role                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`vitest.config.mts`](../vitest.config.mts)             | Vitest + `*.test.*` include + `restoreMocks` + `requireAssertions` + V8 coverage               |
| [`eslint.config.mjs`](../eslint.config.mjs)             | `@vitest/eslint-plugin` on Vitest suite files (choices: [above](#vitest-lint--config-choices)) |
| [`package.json`](../package.json)                       | `test` / `test:run` / `test:coverage` / `test:inspect`                                         |
| [`.vscode/extensions.json`](../.vscode/extensions.json) | `vitest.explorer`                                                                              |
| [`.vscode/launch.json`](../.vscode/launch.json)         | Vitest debug launch configs                                                                    |
| [`AGENTS.md`](../AGENTS.md)                             | Short agent rules (point here for the full map)                                                |
| `**/foo.test.ts(x)`                                     | Colocated Vitest suites (never `*.spec.*`)                                                     |
| `e2e/**/*.spec.ts(x)`                                   | Playwright only (when added; never `*.test.*`)                                                 |
