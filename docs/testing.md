# Testing

Unit / component tests, E2E, and (later) Storybook. Where each tool’s **job** starts and stops — so we don’t duplicate the same assertions in three places.

|                 |                                                                                                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — Vitest setup map, run/debug, **what to test where** (Vitest / Playwright / Storybook)                                                                                                                                      |
| **Open when**   | Choosing a **test type** / tool, adding a test or story, changing Vitest/Playwright/Storybook config, or revisiting **jsdom vs Browser Mode** ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook)) |

**Implementation today:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (**jsdom**). **When needed:** [Playwright](https://playwright.dev) (E2E), [Storybook](https://storybook.js.org) (UI catalog). Stack rationale / learning links / switch triggers: [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook). Index: [`README.md`](./README.md). Agents: [`AGENTS.md`](../AGENTS.md).

## Decision record: Vitest / jsdom / Browser Mode / Playwright / Storybook

So agents and humans don’t re-litigate this stack every session. This section is the **policy + rationale**. When evidence flips a [trigger](#trigger-checklist-for-switching-the-component-default), update **this section** (and config) — don’t invent a parallel stack without rewriting ownership here.

### Current defaults (do this today)

| Job                                                                | Tool                                           | Notes                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Pure logic / schemas / `lib/*`                                     | **Vitest** (Node)                              | `*.test.ts` — no DOM needed                                                           |
| Client component / hook behavior                                   | **Vitest + jsdom + Testing Library**           | `*.test.tsx` — default until triggers flip                                            |
| Component + mocked HTTP                                            | **Vitest + jsdom + MSW** (when needed)         | Still Vitest’s job — not Playwright                                                   |
| Full-app journeys (routes, Clerk, cookies, async RSC, Checkout UI) | **Playwright** (`e2e/*.spec.*`)                | Real browser + real app — [when added](#todo)                                         |
| Visual regression                                                  | **Playwright** screenshots for now             | One visual system; Storybook/Chromatic only if deliberately chosen later              |
| A11y                                                               | Vitest (isolated UI) · Playwright (full pages) | Same split as component vs journey                                                    |
| UI catalog / human workshop                                        | **Storybook**                                  | [When triggers pass](#storybook-when-needed) — **not** a CI component-test runner yet |

**Not defaults:** Vitest Browser Mode as the component default; Storybook `play` / Storybook test-runner as the place for the same CI behavior asserts Vitest already owns; Cypress / Jest.

### Why jsdom is default (history — not dogma)

1. Initial setup followed the [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) (`jsdom` + Testing Library) — a known-good Next wiring path **before** we had deep Browser Mode / Playwright experience to compare.
2. That choice is an **initial default**, not a forever claim that jsdom “beats” Browser Mode. Policy can change when [triggers](#trigger-checklist-for-switching-the-component-default) fire.
3. jsdom is still a **first-class Vitest environment** ([`environment`](https://vitest.dev/config/environment) · [`environmentOptions`](https://vitest.dev/config/environmentoptions)) — not “Jest-only legacy.” What’s weaker is Vitest’s _component-testing narrative_: their [Component Testing](https://vitest.dev/guide/browser/component-testing) guide explicitly recommends **Browser Mode**; [Why Browser Mode](https://vitest.dev/guide/browser/why.html) soft-sells fidelity over simulation. That doc lean ≠ automatic adoption here.
4. Browser Mode is **stable in Vitest 4** (no longer experimental) — a real product signal — but stable ≠ required default for every Next app, especially once Playwright owns real-browser product confidence.

### jsdom vs Browser Mode (decision we already made)

|                         | **jsdom (default)**                                                   | **Vitest Browser Mode (opt-in)**                                                                                                              |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| What it is              | Simulated DOM in Node                                                 | Real browser via a provider (Playwright / WebdriverIO / preview)                                                                              |
| Strength                | Fast feedback; Testing Library ecosystem; matches Next’s Vitest guide | Higher fidelity (layout, focus, pointer, native APIs); Vitest’s own component docs/APIs                                                       |
| Cost                    | Simulation gaps → false positives/negatives on some UI                | Slower init/CI; different APIs; provider packages; browser binaries                                                                           |
| Overlap with Playwright | Low                                                                   | Higher — Browser Mode often uses `@vitest/browser-playwright`; still **does not replace** Playwright E2E                                      |
| Learning                | **Two layers:** Vitest runner + Testing Library for React DOM         | Mostly **Vitest Browser Mode** docs/APIs (matchers forked from jest-dom patterns per [Browser Mode guide](https://vitest.dev/guide/browser/)) |

**Verdict for now:** keep jsdom for component tests. Browser Mode’s fidelity/docs advantages do **not** dominate as a blanket default while Playwright (soon) covers real-browser product journeys and Storybook isn’t adopted yet as a test harness. Even with Playwright installed for E2E, making Browser Mode the _default_ still adds a second real-browser component path, CI cost, and ownership blur — measure before switching.

**Browser Mode cannot replace Playwright.** It improves _isolated component_ fidelity; it does not own async RSC, Clerk sessions, multi-page routes, cookies, or Checkout UI. Vitest’s own [Why Browser Mode](https://vitest.dev/guide/browser/why.html) still says to augment with a standalone browser runner (Playwright, etc.).

**Storybook is not the component-test tool (yet).** We will add Playwright first, then Storybook. Knowledge of Storybook as a test runner isn’t deep enough to reassign CI ownership. Until an explicit rewrite of this section: Storybook = catalog/workshop only; Vitest keeps component CI asserts; Playwright keeps journeys. Using Storybook for component CI would be a deliberate [one tool per job](./vocabulary.md#one-tool-per-job) reassignment — not a silent add-on.

### Agent drift warning

Our [match installed official docs](./conventions.md#match-installed-official-docs) rule means agents will naturally open Vitest’s Browser Mode / Component Testing pages and may treat them as “do this by default.” **Repo wiring wins:** follow **this file** for tool ownership. Official Vitest/Next/Testing Library pages are _how to implement_ the chosen path — not permission to flip defaults without triggers.

### Where to learn (official docs — link-forward, don’t reinvent how-tos here)

This page owns **policy**. Authoring details live in version-matched official docs ([`conventions.md`](./conventions.md#match-installed-official-docs)).

**Default path — Vitest + jsdom + Testing Library (+ jest-dom + user-event):**

| Layer                        | Learn           | Official entry                                                                                                                                                                                                        |
| ---------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner / asserts / mocks     | Vitest          | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html) · [Vi](https://vitest.dev/api/vi.html)                            |
| Enable simulated DOM         | Vitest config   | [`environment`](https://vitest.dev/config/environment) (`jsdom`) · [`environmentOptions`](https://vitest.dev/config/environmentoptions) · Features note: [happy-dom / jsdom](https://vitest.dev/guide/features.html)  |
| Render / query               | Testing Library | [React Testing Library intro](https://testing-library.com/docs/react-testing-library/intro/) · [docs](https://testing-library.com/docs/)                                                                              |
| Assert DOM state after query | jest-dom        | [jest-dom](https://github.com/testing-library/jest-dom#with-vitest) — **why:** [Already following](#already-following)                                                                                                |
| Interact (click / type)      | user-event      | [user-event intro](https://testing-library.com/docs/user-event/intro) — **why / how:** [Already following](#already-following) · [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem) |
| Next wiring (install shape)  | Next.js         | [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest) — **setup example**, not a substitute for Vitest `environment` docs                                                                          |

Yes: with jsdom you learn **Vitest + Testing Library + jest-dom + user-event**, not Vitest alone. That is the cost of the current default.

**Opt-in / future path — Vitest Browser Mode:**

| Topic               | Official entry                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Why / tradeoffs     | [Why Browser Mode](https://vitest.dev/guide/browser/why.html)                                                                                                                        |
| Setup / providers   | [Browser Mode guide](https://vitest.dev/guide/browser/) · [`browser.enabled`](https://vitest.dev/config/browser/enabled)                                                             |
| Component patterns  | [Component Testing](https://vitest.dev/guide/browser/component-testing) (Vitest **recommends** Browser Mode here)                                                                    |
| Playwright provider | [`@vitest/browser-playwright` config](https://vitest.dev/config/browser/playwright) — install provider package; browser binaries still needed (same class of cost as E2E Playwright) |

**E2E / catalog (when added):** [Playwright](https://playwright.dev) · [Next.js Playwright](https://nextjs.org/docs/app/guides/testing/playwright) · [Storybook](https://storybook.js.org/docs) — ownership still [above](#current-defaults-do-this-today).

### Trigger checklist for switching the component default

Change the **default** from jsdom → Browser Mode (or another clearly better owner) only when evidence supports it — then update this section + `vitest.config.mts` / deps together.

Any of:

1. **Fidelity pain:** jsdom mismatches (layout / focus / pointer / observers / native APIs) repeatedly let real bugs through or force awkward test-only workarounds on a meaningful set of components.
2. **Authoring / docs pain:** after real use, the team finds Browser Mode (or another stack) clearly easier to learn and maintain for component tests than the Vitest + Testing Library + jsdom split — not a one-off preference.
3. **Measured cost OK:** Browser Mode CI/runtime cost is acceptable for the suite size (don’t guess “a bit slower” forever — pilot timings).
4. **Boundaries stay clean:** after the switch we still have one CI owner per job — no duplicate asserts across Vitest Browser Mode, Playwright E2E, and Storybook.

**Pilot before blanket switch:** write a small slice of the same component asserts under jsdom and Browser Mode; compare flake, authoring friction, and `vitest run` / CI time; then decide.

**Storybook as component CI** is a separate, explicit decision (reassign ownership in this file). Do not treat “Storybook is added” as flipping component tests off Vitest.

### Doc ownership (keep DRY)

| Concern                                                                                | SoT file                                                                                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test **type** → which **tool** · harness · scripts · jsdom vs Browser Mode · Storybook | **This file** ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) + [what to test where](#what-to-test-where)) |
| Mid-suffix companions (`*.test.tsx`, `*.stories.tsx`) · props-in-JSX                   | [`conventions.md`](./conventions.md#companion-files-role-mid-suffixes-vs-bare-names)                                                               |
| Folders (`e2e/`, avoid `tests/`, `fixtures/`)                                          | [`project-structure.md`](./project-structure.md)                                                                                                   |
| Catalog status (Adopted / When needed) for Vitest / Playwright / MSW / Storybook       | [`conventions.md`](./conventions.md) tooling rows → link here for detail                                                                           |
| Version-matched official docs                                                          | [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs)                                                 |

### Official docs (match installed version)

Follow [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs) (Vitest / Testing Library / Playwright rows). **Learning entrypoints + stack rationale:** [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) (don’t skip — Vitest’s component docs lean Browser Mode; our default is still jsdom until triggers flip). Next + Vitest install shape: [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest). Handy Vitest pages: [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html) · [Debugging](https://vitest.dev/guide/debugging.html) · [Coverage](https://vitest.dev/guide/coverage.html).

This page is **our** wiring. Tool exclusivity ([one tool per job](./vocabulary.md#one-tool-per-job)):

- **Unit / component behavior:** Vitest only — never Jest (`vi.*`, not `jest.*`). Component env default = **jsdom** + Testing Library until [triggers](#trigger-checklist-for-switching-the-component-default)
- **E2E:** Playwright only when added — never Cypress. Browser Mode ≠ E2E
- **UI catalog:** Storybook only when [triggers](#storybook-when-needed) pass — not a second CI test runner

## Already following

- Vitest + `@vitejs/plugin-react` + jsdom + Testing Library (`@testing-library/react`, `@testing-library/dom`)
- **Why `@testing-library/jest-dom`:** Vitest’s built-in matchers (`toBeTruthy`, `toEqual`, …) are generic — they don’t speak DOM. Testing Library **renders and queries** the tree; it does **not** add matchers. jest-dom fills that gap with intent-shaped asserts (`toBeInTheDocument()`, `toBeVisible()`, `toHaveAttribute()`, …) and clearer failure messages for component tests. It is listed in the [Testing Library ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem) as the companion for custom DOM matchers. Wired in [`vitest.setup.ts`](../vitest.setup.ts) via `import "@testing-library/jest-dom/vitest"` — **matchers only**, not the Jest runner (the “jest” name is historical). Do **not** add `vitest-dom` (stale fork of the same matchers).
- **Why `@testing-library/user-event`:** Testing Library’s `fireEvent` dispatches a single low-level DOM event; real users cause sequences (focus → keys → input) plus visibility/interactivity checks. user-event is the [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem) companion that simulates those interactions — prefer it for clicks/typing in interactive component tests; keep `fireEvent` only for gaps user-event doesn’t cover yet ([intro](https://testing-library.com/docs/user-event/intro)). **No Vitest `setupFiles` entry** — import per test and call `userEvent.setup()` **before** `render` (instance API in v14; don’t park `userEvent` in `beforeEach`). Example:

```ts
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

test("submits on click", async () => {
  const user = userEvent.setup();
  render(<MyForm />);
  await user.click(screen.getByRole("button", { name: /save/i }));
  // …
});
```

- Config: [`vitest.config.mts`](../vitest.config.mts) — `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]` (jest-dom only), `restoreMocks: true`, `expect.requireAssertions: true`, `coverage.provider: "v8"`, `vite-tsconfig-paths` for `@/*`
- Scripts: `pnpm test` (watch), `pnpm test:run` (CI/agents), `pnpm test:coverage` (`vitest run --coverage`), `pnpm test:inspect` (Chrome DevTools / Node inspector)
- Coverage: `@vitest/coverage-v8` — [Coverage](https://vitest.dev/guide/coverage.html); reports under `coverage/` (gitignored)
- VS Code: recommend `vitest.explorer`; launch configs in [`.vscode/launch.json`](../.vscode/launch.json)
- Colocated `*.test.ts` / `*.test.tsx` (**Vitest only**; never `*.spec.*`) — [`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md)
- Explicit Vitest imports (no `globals`); `vi.*` only (Jest is never used here)
- ESLint on `**/*.test.{ts,tsx}` (not `e2e/`): [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) (`recommended` + repo extras) + [`eslint-plugin-jest-dom`](https://github.com/testing-library/eslint-plugin-jest-dom) (`flat/recommended`) + [`eslint-plugin-testing-library`](https://github.com/testing-library/eslint-plugin-testing-library) (`flat/react`) — runner hygiene, prefer jest-dom matchers, and Testing Library query/async practices; rationale in [Vitest lint & config choices](#vitest-lint--config-choices) · [`eslint.config.mjs`](../eslint.config.mjs)
- Suffix split: `*.test.*` = Vitest (colocated only — no `__tests__/` / `tests/` / root `test/`), `e2e/*.spec.*` = Playwright ([why not `tests/`](#playwright-folder-e2e-not-tests)) — [enforced](#vitest-lint--config-choices)
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

| Choice                                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Reference                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setupFiles` → [`vitest.setup.ts`](../vitest.setup.ts) + jest-dom       | **Problem:** component tests need DOM asserts; Vitest matchers aren’t DOM-aware and Testing Library doesn’t ship matchers. **Fix:** jest-dom (ecosystem companion). Wire once via `import "@testing-library/jest-dom/vitest"` — not the default Jest entry. **No `tsconfig` change:** setup is already in `"include": ["**/*.ts"]`; skip official `"types": ["vitest/globals", "@testing-library/jest-dom"]` — we don’t use Vitest globals, and the default jest-dom types target Jest (the `/vitest` import augments Vitest instead). | [Why above](#already-following) · [jest-dom → With Vitest](https://github.com/testing-library/jest-dom#with-vitest) · [setupFiles](https://vitest.dev/config/setupfiles)                                                                                                    |
| `@testing-library/user-event` (dep only — no `setupFiles`)              | **Problem:** interactive tests need realistic click/type; `fireEvent` is one low-level dispatch. **Fix:** user-event (ecosystem companion). **Config:** none in Vitest — `import userEvent` + `userEvent.setup()` before `render` per test (v14 instance API). Prefer over `fireEvent`; no shared test-utils helper yet.                                                                                                                                                                                                               | [Why above](#already-following) · [user-event intro](https://testing-library.com/docs/user-event/intro) · [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem)                                                                              |
| `restoreMocks: true`                                                    | Spies/mocks (especially AI-written) often skip cleanup; restore between tests                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)                                                                                                                                                                                          |
| `expect.requireAssertions: true`                                        | Runtime fail if a test never calls Vitest `expect` (empty / accidental pass)                                                                                                                                                                                                                                                                                                                                                                                                                                                           | [expect.requireAssertions](https://vitest.dev/config/expect.html#expect-requireassertions)                                                                                                                                                                                  |
| ESLint Vitest `recommended` (not `all`)                                 | Correctness / anti-footgun baseline. `all` is mostly style, padding (Prettier’s job), and downgrades many rules to `warn`                                                                                                                                                                                                                                                                                                                                                                                                              | [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) shareable configs                                                                                                                                                                             |
| ESLint `eslint-plugin-jest-dom` `flat/recommended`                      | **Why:** after adding jest-dom matchers, stop writing weaker generic asserts (`toBeTruthy` on a node, `getAttribute` + `toBe`, …). Plugin nudges `toBeInTheDocument` / `toHaveAttribute` / etc. Same Vitest file glob; not the Jest runner. Use `recommended`, not `all`.                                                                                                                                                                                                                                                              | [plugin README](https://github.com/testing-library/eslint-plugin-jest-dom#recommended-configuration) · [jest-dom install](https://github.com/testing-library/jest-dom#installation) · [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem)  |
| ESLint `eslint-plugin-testing-library` `flat/react`                     | **Why:** Testing Library has footguns (sync vs async queries, `waitFor` misuse, `container`/`node` access, leftover `debug`). Lint catches them before CI flakes. Use **`flat/react`** (not `flat/dom`) — we render with `@testing-library/react`. Same Vitest file glob; separate job from jest-dom matcher lint.                                                                                                                                                                                                                     | [plugin README → React](https://github.com/testing-library/eslint-plugin-testing-library#react) · [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem)                                                                                      |
| Vitest `include` = `*.test.*` only; exclude `e2e/`                      | Vitest must not pick up Playwright files (both tools accept `.test` and `.spec` by default)                                                                                                                                                                                                                                                                                                                                                                                                                                            | [include](https://vitest.dev/config/include.html) · [Playwright testMatch](https://playwright.dev/docs/api/class-testconfig#test-config-test-match)                                                                                                                         |
| ESLint Vitest + jest-dom + testing-library on `**/*.test.{ts,tsx}` only | Don’t lint Playwright specs as Vitest / Testing Library suites                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) · [`eslint-plugin-jest-dom`](https://github.com/testing-library/eslint-plugin-jest-dom) · [`eslint-plugin-testing-library`](https://github.com/testing-library/eslint-plugin-testing-library) |
| Ban `*.spec.*` outside `e2e/`; ban `*.test.*` inside `e2e/`             | Hard suffix split: Vitest ↔ Playwright                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [`eslint.config.mjs`](../eslint.config.mjs)                                                                                                                                                                                                                                 |
| Ban Vitest separate suite folders: `__tests__/`, `tests/`, root `test/` | Vitest docs allow these; we colocate only. Nested `test/` left alone (may be an App Router segment). Not `__mocks__` (mock dirs)                                                                                                                                                                                                                                                                                                                                                                                                       | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html#organizing-test-files) · [`project-structure.md`](./project-structure.md)                                                |
| Ban `@playwright/test` in `*.test.*`; ban `vitest` in `e2e/*.spec.*`    | Wrong runner import is a smell even before Playwright lands                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | [`eslint.config.mjs`](../eslint.config.mjs)                                                                                                                                                                                                                                 |
| Playwright under `e2e/` (not `tests/`)                                  | Next/Playwright scaffolds often use `tests/`; we use `e2e/` so Vitest can keep banning catch-all `tests/` — [rationale](#playwright-folder-e2e-not-tests)                                                                                                                                                                                                                                                                                                                                                                              | [Playwright install](https://playwright.dev/docs/intro) · [Next.js Playwright](https://nextjs.org/docs/app/guides/testing/playwright)                                                                                                                                       |
| `consistent-test-it` → `test`                                           | Vitest guides lead with `test`; `it` is an identical alias — pick one                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-test-it.md)                                                                                                  |
| `consistent-vitest-vi` → `vi`                                           | Docs document the helper as `vi.*`; `vitest` is the same object under another name                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [Vi API](https://vitest.dev/api/vi.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-vitest-vi.md)                                                                                                                          |
| `prefer-importing-vitest-globals`                                       | We do **not** enable Vitest `globals`; always `import { … } from "vitest"`                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [Using Global Imports](https://vitest.dev/guide/learn/writing-tests.html#using-global-imports) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-importing-vitest-globals.md)                                                         |
| `consistent-each-for`                                                   | Prefer `test.for` over Jest-style `test.each` in new code                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-each-for.md)                                                                                                 |
| `hoisted-apis-on-top`                                                   | `vi.mock` / `vi.hoisted` are hoisted — keep them at the top of the file                                                                                                                                                                                                                                                                                                                                                                                                                                                                | [vi.mock](https://vitest.dev/api/vi.html#vi-mock) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/hoisted-apis-on-top.md)                                                                                                                  |
| `no-alias-methods`                                                      | Prefer full matcher names (`toHaveBeenCalled`) over aliases (`toBeCalled`)                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-alias-methods.md)                                                                                                                                                                         |
| `no-test-prefixes`                                                      | Prefer `.only` / `.skip` over `f` / `x` prefixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-test-prefixes.md)                                                                                                                                                                         |
| `prefer-hooks-on-top` · `prefer-hooks-in-order` · `no-duplicate-hooks`  | Stable setup/teardown layout; no accidental double hooks                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | [rules](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules)                                                                                                                                                                                            |
| `max-nested-describe` (`max: 3`)                                        | Keep `describe` nesting shallow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/max-nested-describe.md)                                                                                                 |
| **Skip** `prefer-expect-assertions`                                     | Runtime `requireAssertions` already covers “must assert”; no need for ceremonial `expect.hasAssertions()`                                                                                                                                                                                                                                                                                                                                                                                                                              | [expect.requireAssertions](https://vitest.dev/config/expect.html#expect-requireassertions)                                                                                                                                                                                  |
| **Skip** `padding-around-*` / most of `all`                             | Prettier owns formatting; avoid a second style guide                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | [`conventions.md`](./conventions.md) (lint & format) · plugin `all` config                                                                                                                                                                                                  |

`recommended` already includes `expect-expect` (lint-time “has an assertion”) alongside runtime `requireAssertions` — complementary, not duplicate tooling.

### Playwright folder: `e2e/` (not `tests/`)

| Source                                                                            | What they use                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Playwright install](https://playwright.dev/docs/intro)                           | Prompts for a tests folder; **default `tests`**, or **`e2e` if `tests` already exists** |
| [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright) | Example path `tests/example.spec.ts`                                                    |
| Common practice (Playwright-only apps)                                            | Often `tests/` or `tests/e2e/`                                                          |

**Our choice: `e2e/*.spec.ts(x)`.** Reasons:

1. Vitest is colocated (`*.test.*` next to modules) — we **ban** catch-all `tests/` / `__tests__/` / root `test/` so agents don’t park unit suites there ([above](#vitest-lint--config-choices)).
2. Reusing root `tests/` for Playwright would collide with that ban (or force a muddy exception).
3. Playwright’s own installer already falls back to **`e2e`** when `tests` is taken — the same conflict we have with colocated Vitest.
4. `e2e/` names the **job** (full-app browser flows), matching [one tool per job](./vocabulary.md#one-tool-per-job): Vitest = unit/component; Playwright = E2E.

When Playwright lands: set `testDir: "e2e"` (and prefer `testMatch` for `*.spec.*`). Do **not** follow the Next.js example’s `tests/` path in this repo.

## TODO

- [x] First colocated suite(s) — pure `lib/` helpers + Zod `actions/*/schema.ts` (P0). Remaining Vitest backlog (P1 mocked I/O / stores / `use-action`, P2 components, P3 MSW + reorder, P4 polish): [`.cursor/plans/vitest_test_backlog_c23a3686.plan.md`](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md)
- [ ] Client component suites (jest-dom for DOM asserts; `userEvent.setup()` for interactions) — plan P2
- [ ] Drop `vite-tsconfig-paths` for Vite native `resolve.tsconfigPaths` if the deprecation warning stays noisy
- [ ] MSW when a Query-backed UI needs HTTP mocks — [`conventions.md`](./conventions.md) · plan P3
- [ ] Playwright for critical flows (auth, board, billing) — `e2e/*.spec.ts` only (never `*.test.*`; only E2E tool; no Cypress)
- [ ] Storybook when [catalog triggers](#storybook-when-needed) pass — catalog/workshop only; colocated `*.stories.tsx` (not CI component-test owner unless [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) rewritten)
- [ ] Revisit Vitest Browser Mode only if [triggers](#trigger-checklist-for-switching-the-component-default) fire — pilot jsdom vs Browser Mode before blanket switch; update decision record + config together
- [ ] CI: run `pnpm test:run` (and optionally `pnpm test:coverage`) on PRs when suites exist
- [ ] `@vitest/ui` (`vitest --ui` / optional `html` reporter) when browser suite exploration or CI HTML reports beat the VS Code Testing view — [Vitest UI](https://vitest.dev/guide/ui.html)
- [ ] Tighten `coverage.include` / thresholds once suites exist and the report is noisy — plan P4

## Out of scope for now

- **Jest** (runner or `jest.*` APIs) — forever out of scope; Vitest only for unit/component. `@testing-library/jest-dom` is **DOM matchers only** (wired via `/vitest`) — not permission to add Jest
- **`vitest-dom`** — stale fork of jest-dom; use `@testing-library/jest-dom/vitest` instead ([one tool per job](./vocabulary.md#one-tool-per-job))
- **Cypress** and any other E2E runner beside Playwright — forever out of scope
- **Storybook as a CI component/E2E test runner** — catalog/workshop only until an explicit ownership rewrite in the [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook); never duplicate Vitest/Playwright asserts in `play`/Storybook test-runner by default
- **Vitest Browser Mode as the default component environment** — opt-in / future switch only when [triggers](#trigger-checklist-for-switching-the-component-default) fire; default remains jsdom ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook))
- Catch-all Vitest trees (`tests/`, `__tests__/`, root `test/`) — colocate `*.test.*`; `e2e/` for Playwright
- Async Server Components in Vitest — use Playwright E2E ([Next.js note](https://nextjs.org/docs/app/guides/testing/vitest)); neither jsdom nor Browser Mode fixes this

## What to test where

The confusing part is **test type** (what you are verifying) vs **tool** (what runs it). Same-looking checks can live in Vitest, Playwright, or Storybook — this repo picks **one owner per type** ([one tool per job](./vocabulary.md#one-tool-per-job)).

Until Storybook exists, **Vitest + Playwright cover all automated verification**. Storybook later adds a **catalog/workshop** job, not a second place for the same CI assertions.

### Decide in order

Ask top → bottom; stop at the first yes:

1. **Needs the real running app?** (Clerk session, real routes, async RSC, Stripe Checkout UI, multi-page navigation, real cookies) → **Playwright** (`e2e/*.spec.ts`).
2. **Pure logic — no React tree?** (Zod schema, `lib/*` helper, money/path formatting) → **Vitest unit** (`*.test.ts`).
3. **One client component / hook — assert behavior?** (render, click, type, empty/error UI as DOM assertions) → **Vitest component** (`*.test.tsx` + Testing Library + **jsdom**). Use Browser Mode only if [triggers](#trigger-checklist-for-switching-the-component-default) / an explicit opt-in pilot say so — not because Vitest’s component guide prefers it.
4. **Client UI that talks HTTP via Query?** → still **Vitest**, mock HTTP with **MSW** when needed (not Playwright).
5. **Humans need a browsable gallery of UI variants?** → **Storybook** only when [triggers](#storybook-when-needed) pass — not for CI assertions of the same behavior.
6. **Pixel / screenshot diff?** → **Playwright** until a Storybook visual workshop is deliberately adopted (then pick **one** visual system).

```text
Needs full app / real browser product? ──yes──► Playwright
         │ no
Pure function / schema? ──yes──► Vitest unit (Node)
         │ no
Component or hook behavior? ──yes──► Vitest + jsdom (+ MSW if HTTP)
         │                                      └─ Browser Mode only if triggers / pilot
Catalog for humans? ──yes──► Storybook (when triggered; not CI assert owner)
         │ no
Visual regression only? ──yes──► Playwright (for now)
```

### Test types (vocabulary)

| Test type                   | What you are checking                                        | Runs in                  | **Tool here**                                                                        | Typical files                | Examples                                                                               |
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

|           | Static component test               | Interactive component test                         |
| --------- | ----------------------------------- | -------------------------------------------------- |
| Acts like | Snapshot of the tree after `render` | User clicking/typing                               |
| Assert    | Roles, text, attributes             | Outcomes after `userEvent`                         |
| Use when  | Props → markup                      | Behavior matters                                   |
| Still     | Vitest + Testing Library + jest-dom | Vitest + Testing Library + jest-dom + `user-event` |

jsdom is **not** a real browser: no real layout engine, incomplete Web APIs. If the bug is “dnd geometry,” “Clerk hosted UI,” or “RSC stream on this route,” that is **Playwright**, not a harder Vitest test — and usually not “switch the whole suite to Browser Mode” either. Browser Mode is for _isolated_ real-browser component fidelity when [triggers](#trigger-checklist-for-switching-the-component-default) say so; product journeys stay Playwright.

### Overlap traps (pick one owner)

| Tempting duplicate                                                   | Keep                                                                               | Drop                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Same button toggle asserted in Vitest **and** Playwright             | Vitest for the component; Playwright only inside a **journey** if the flow matters | Playwright-only click of that button with no product context |
| Empty/error **behavior** in Vitest **and** a Storybook `play` assert | Vitest                                                                             | Storybook `play` as CI assert for the same thing             |
| Full sign-in flow in Vitest with mocks **and** Playwright            | Playwright                                                                         | Fake “E2E” in jsdom                                          |
| Same component behavior in Vitest **and** Browser Mode by default    | One component env (jsdom today)                                                    | Parallel default stacks                                      |
| Component CI in Storybook **and** Vitest                             | Vitest (until ownership rewritten)                                                 | Storybook test-runner / `play` as CI for the same asserts    |
| Screenshot in Playwright **and** Chromatic for the same surface      | Choose **one** visual system when both exist                                       | Both forever                                                 |

### Mental model

```text
Vitest (Node)           →  pure logic
Vitest + jsdom (+ TL)   →  component behavior (default)
Vitest Browser Mode     →  opt-in / future component fidelity (triggers)
Playwright              →  product works end-to-end (real app + real browser)
Storybook               →  humans browse / compose UI (catalog — when triggered)
```

### Prisma-related code (what to test how)

Prisma shows up in tests in **different layers**. Official [unit testing](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing) / [integration testing](https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing) pages may still show **Jest** and older layouts. Prefer **this section** as repo wiring, and treat Prisma’s [Testing with Prisma blog series](https://www.prisma.io/blog/series/testing-with-prisma) as optional background (Vitest-oriented; verified on Prisma 7 / Vitest 4 in recent updates). Schema/Client patterns: [`prisma.md`](./prisma.md). Backlog: [`.cursor/plans/vitest_test_backlog_c23a3686.plan.md`](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md).

**Blog series — read when** (full series is five parts; do not treat parts 1–2 as the whole series):

| Part                                                                         | Topic                             | Read when                                       |
| ---------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| [1 – Mocking Client](https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o) | `vi.mock` / fake Client           | First Vitest suite that **calls** Prisma Client |
| [2 – Unit testing](https://www.prisma.io/blog/testing-series-2-xPhjjmIEsM)   | What to test / skip around Client | Same milestone                                  |
| [3 – Integration](https://www.prisma.io/blog/testing-series-3-aBUyF8nxAn)    | Real DB                           | If we add Vitest integration against Postgres   |
| [4 – E2E](https://www.prisma.io/blog/testing-series-4-OVXtDis201)            | Playwright + Prisma cleanup       | When Playwright lands                           |
| [5 – CI](https://www.prisma.io/blog/testing-series-5-xWogenROXm)             | Pipelines                         | When CI runs those suites                       |

Parts **1–2** are the least you need for current/near-term Client unit tests. Types-only helpers (below) do not require the series.

**Vocabulary**

| Term        | Meaning here                                                                              |
| ----------- | ----------------------------------------------------------------------------------------- |
| **Fixture** | Plain object shaped like a model row (or a partial of one) — not a replacement for Client |
| **Mock**    | Fake dependency (`vi.mock` / stubbed Client methods) so tests don’t hit the DB            |
| **Spy**     | Assert a mocked method was called (and with what args)                                    |

**Decide in order** (stop at the first match):

1. **Types / enums only** — function uses generated `AuditLog` / `ACTION` / … but never calls Prisma Client → **Vitest unit** with static inputs. Do **not** mock Client. Example: [`lib/generate-log-message.ts`](../lib/generate-log-message.ts) + [`lib/generate-log-message.test.ts`](../lib/generate-log-message.test.ts).
2. **Calls Prisma Client** (custom logic around `create` / `findMany` / …) → **Vitest unit** with a **mocked** [`lib/prisma.ts`](../lib/prisma.ts) when that suite lands. First candidate: [`lib/create-audit-log.ts`](../lib/create-audit-log.ts). Skip unit tests that only forward to Client with no branching (blog part 2).
3. **Need real SQL / relations** → integration against a test DB (later; blog part 3 / Prisma integration docs) — not default for app helpers.
4. **Full product journey** → **Playwright** (blog part 4 when relevant).

```text
Uses Prisma Client? ──no──► types-only unit (no Client mock)
         │ yes
Custom logic around queries? ──no──► skip Vitest (thin wrapper)
         │ yes
Need real DB correctness? ──no──► Vitest + mocked Client (when added)
         │ yes
                         └──► integration DB or Playwright
```

**How to mock Client (Vitest only — no extra package by default)**

Installed Vitest ([Mocking Modules](https://vitest.dev/guide/mocking/modules) · [Vi](https://vitest.dev/api/vi.html)) already supports:

- **`vi.mock` factory** returning only the methods under test as `vi.fn()` (preferred for a small surface like `auditLog.create`)
- **Colocated `lib/__mocks__/prisma.ts`** loaded by `vi.mock("@/lib/prisma")` without a factory ([`__mocks__` convention](https://vitest.dev/api/vi.html#vi-mock)) — `__mocks__` dirs are allowed; catch-all `__tests__/` / `tests/` are not
- **Automock** (`vi.mock` with no factory and no `__mocks__` file): Vitest recursively replaces exports (nested objects / class instances); useful for plain modules — Prisma Client is a heavy instance/Proxy, so prefer an explicit factory or `__mocks__` stub of methods you call

**Do not add `vitest-mock-extended` by default.** The Prisma blog uses `mockDeep` for convenience. Vitest does not require it. Add that package only if a narrow manual stub becomes painful (many models, interactive `$transaction`, etc.) — [one tool per job](./vocabulary.md#one-tool-per-job).

**Types-only + full model type (named cast):** Use when production takes a **full Prisma model type** but the test only cares about a few fields. Prefer keeping the production param as the model type (e.g. `AuditLog`) when call sites pass real rows. In the test, use a **named cast** helper that accepts `Pick<…>` of fields under test and returns `as AuditLog` — do **not** invent unused columns (`id`, timestamps, …) only to satisfy TypeScript. See `auditLogForMessage` in [`lib/generate-log-message.test.ts`](../lib/generate-log-message.test.ts). Zod schema suites and other plain-input unit tests do not need this pattern.

**Do not add `"type": "module"` to root [`package.json`](../package.json)** to “match” Prisma blog samples. Those samples are bare Node/Vitest packages. This app relies on Next.js, Vitest/Vite, and `node --import tsx` for scripts; forcing package-wide ESM can break CJS assumptions. Revisit only if a concrete Node entrypoint fails without it.

**Not yet:** Client-mock suites / `lib/__mocks__/prisma.ts` — add with the first Client-using unit test (plan P1 / `create-audit-log`), not for types-only helpers.

### Storybook (when needed)

**Not** a Vitest or Playwright replacement, and **not** our component-test tool until this doc explicitly reassigns ownership ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook)). Planned order: Playwright E2E first, Storybook later. Prefer [Storybook](https://storybook.js.org) over Ladle/Histoire ([`conventions.md`](./conventions.md)).

**Triggers (any one is enough) to _add_ Storybook as catalog:**

- Design/review needs a **browsable catalog** of UI variants without booting the full app
- Handing a **design system / shared UI** set to others (docs + isolated playground)
- A deliberate **visual workshop** workflow (e.g. Chromatic) that Storybook fits better than Playwright screenshots alone

**When added (catalog role):**

- Colocate `*.stories.tsx` next to the component ([`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md))
- Own **catalog / workshop / human review** — stories may _demo_ interactions; **CI assertions for the same behavior stay in Vitest** (and journeys in Playwright)
- Don’t maintain two assertion suites for one outcome ([one tool per job](./vocabulary.md#one-tool-per-job))
- Optional later: Storybook’s Vitest/browser / test-runner addons — **only** with an explicit decision recorded in the [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook); default remains colocated Vitest `*.test.tsx` + jsdom for behavior

## Run

| Script               | When                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`          | Local watch (humans)                                                                                                                          |
| `pnpm test:run`      | One-shot — agents, CI, pre-commit checks                                                                                                      |
| `pnpm test:coverage` | One-shot with V8 coverage report (`coverage/`) — [Coverage](https://vitest.dev/guide/coverage.html)                                           |
| `pnpm test:inspect`  | Pause for Chrome DevTools (`chrome://inspect`) — [Node inspector](https://vitest.dev/guide/debugging.html#node-inspector-e-g-chrome-devtools) |

Pass Vitest CLI args after `--` so pnpm forwards them to the script (not to pnpm itself):

```bash
pnpm test:run -- lib/paths.test.ts
pnpm test:coverage -- lib/paths.test.ts
```

`test:coverage` still reports every path in `coverage.include` ([`vitest.config.mts`](../vitest.config.mts)); many files may show 0% when only one suite ran. Narrow the **report** with Vitest’s coverage filter:

```bash
pnpm test:coverage -- lib/paths.test.ts --coverage.include=lib/paths.ts
```

HTML report: `coverage/index.html` (gitignored). No extra package script for this — Vitest CLI is enough ([one tool per job](./vocabulary.md#one-tool-per-job)).

## Debug

1. **Preferred:** Testing view → **Debug Test** (`vitest.explorer`)
2. **F5 / Debug panel:** configs in [`.vscode/launch.json`](../.vscode/launch.json) — current file, current file (watch), all tests (`--test-timeout=0`, `--no-file-parallelism`)
3. **JavaScript Debug Terminal** + `pnpm test` — zero config
4. **`pnpm test:inspect`** + `chrome://inspect` — IDE-optional

## File map

| Path                                                    | Role                                                                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`vitest.config.mts`](../vitest.config.mts)             | Vitest + `setupFiles` + `*.test.*` include + `restoreMocks` + `requireAssertions` + V8 coverage                                               |
| [`vitest.setup.ts`](../vitest.setup.ts)                 | jest-dom on Vitest `expect` — **why:** DOM asserts; see [Already following](#already-following)                                               |
| [`eslint.config.mjs`](../eslint.config.mjs)             | `@vitest/eslint-plugin` + `eslint-plugin-jest-dom` + `eslint-plugin-testing-library` on Vitest suites ([above](#vitest-lint--config-choices)) |
| [`package.json`](../package.json)                       | `test` scripts · Testing Library deps (`jest-dom`, `user-event`, …)                                                                           |
| [`.vscode/extensions.json`](../.vscode/extensions.json) | `vitest.explorer`                                                                                                                             |
| [`.vscode/launch.json`](../.vscode/launch.json)         | Vitest debug launch configs                                                                                                                   |
| [`AGENTS.md`](../AGENTS.md)                             | Short agent rules (point here for the full map)                                                                                               |
| `**/foo.test.ts(x)`                                     | Colocated Vitest suites (never `*.spec.*`)                                                                                                    |
| `e2e/**/*.spec.ts(x)`                                   | Playwright only (when added; never `*.test.*`)                                                                                                |
