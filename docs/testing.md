# Testing

Unit / component tests, E2E, and (later) Storybook. Where each tool’s **job** starts and stops — so we don’t duplicate the same assertions in three places.

|                 |                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner / SoT** | This file — Vitest setup map, run/debug, **what to test where** (Vitest / Playwright / Storybook), **terms & naming**                                                                                                                                                    |
| **Open when**   | Choosing a **test type** / tool, adding a test or story, naming tests / Vitest vocabulary, changing Vitest/Playwright/Storybook config, or revisiting **jsdom vs Browser Mode** ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook)) |

**Implementation today:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (**jsdom**). **When needed:** [Playwright](https://playwright.dev) (E2E), [Storybook](https://storybook.js.org) (UI catalog). Stack rationale / learning links / switch triggers: [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook). Index: [`README.md`](./README.md). Agents: [`AGENTS.md`](../AGENTS.md).

## Decision record: Vitest / jsdom / Browser Mode / Playwright / Storybook

So agents and humans don’t re-litigate this stack every session. This section is the **policy + rationale**. When evidence flips a [trigger](#trigger-checklist-for-switching-the-component-default), update **this section** (and config) — don’t invent a parallel stack without rewriting ownership here.

### Current defaults (do this today)

| Job                                                                | Tool                                           | Notes                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Pure logic / schemas / `lib/*`                                     | **Vitest** (Node)                              | `*.test.ts` — no DOM needed                                                                             |
| Hook via `renderHook` (no JSX in the suite)                        | **Vitest + jsdom + Testing Library**           | Match source: `foo.ts` → `foo.test.ts` (e.g. [`hooks/use-action.test.ts`](../hooks/use-action.test.ts)) |
| Client **component** behavior (JSX in the suite)                   | **Vitest + jsdom + Testing Library**           | Match source: `foo.tsx` → `foo.test.tsx` — default until Browser Mode triggers flip                     |
| Component + mocked HTTP                                            | **Vitest + jsdom + MSW** (when needed)         | Still Vitest’s job — not Playwright                                                                     |
| Full-app journeys (routes, Clerk, cookies, async RSC, Checkout UI) | **Playwright** (`e2e/*.spec.*`)                | Real browser + real app — [when added](#todo)                                                           |
| Visual regression                                                  | **Playwright** screenshots for now             | One visual system; Storybook/Chromatic only if deliberately chosen later                                |
| A11y                                                               | Vitest (isolated UI) · Playwright (full pages) | Same split as component vs journey                                                                      |
| UI catalog / human workshop                                        | **Storybook**                                  | [When triggers pass](#storybook-when-needed) — **not** a CI component-test runner yet                   |

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

| Concern                                                                                                      | SoT file                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test **type** → which **tool** · harness · scripts · jsdom vs Browser Mode · Storybook                       | **This file** ([decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) + [what to test where](#what-to-test-where)) |
| Vitest **authoring terms** (`test` **name**, suite, assertion, …) · how we **name** tests · **expect order** | **This file** ([Vitest terms & naming](#vitest-terms--naming) · [expects follow execution order](#expects-follow-execution-order-hard-rule))       |
| Mid-suffix companions (`*.test.tsx`, `*.stories.tsx`) · props-in-JSX                                         | [`conventions.md`](./conventions.md#companion-files-role-mid-suffixes-vs-bare-names)                                                               |
| Folders (`e2e/`, avoid `tests/`, `fixtures/`)                                                                | [`project-structure.md`](./project-structure.md)                                                                                                   |
| Test-only helper folder (`lib/testing/`)                                                                     | **This file** ([Test-only helpers](#test-only-helpers-libtesting))                                                                                 |
| MSW HTTP mocks in Vitest (wiring + do/don’t)                                                                 | **This file** ([MSW in this repo](#msw-in-this-repo))                                                                                              |
| Catalog status (Adopted / When needed) for Vitest / Playwright / MSW / Storybook                             | [`conventions.md`](./conventions.md) tooling rows → link here for detail                                                                           |
| Version-matched official docs                                                                                | [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs)                                                 |

### Official docs (match installed version)

Follow [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs) (Vitest / Testing Library / MSW / Playwright rows). **Learning entrypoints + stack rationale:** [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) (don’t skip — Vitest’s component docs lean Browser Mode; our default is still jsdom until triggers flip). Next + Vitest install shape: [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest). Handy Vitest pages: [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html) (incl. [Naming Tests](https://vitest.dev/guide/learn/testing-in-practice.html#naming-tests) · [Descriptive Names](https://vitest.dev/guide/learn/testing-in-practice.html#descriptive-names)) · [Debugging](https://vitest.dev/guide/debugging.html) · [Coverage](https://vitest.dev/guide/coverage.html) · [API: `test`](https://vitest.dev/api/#test). Repo glossary for those words: [Vitest terms & naming](#vitest-terms--naming). MSW (Query/HTTP UI): [MSW in this repo](#msw-in-this-repo).

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

- Config: [`vitest.config.mts`](../vitest.config.mts) — `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]` (jest-dom + RTL `cleanup` + MSW `setupServer` lifecycle — we don’t use Vitest `globals`, so RTL’s auto-cleanup hook doesn’t run), `restoreMocks: true`, `mockReset: true`, `unstubGlobals: true`, `unstubEnvs: true`, `expect.requireAssertions: true`, `coverage.provider: "v8"`, `vite-tsconfig-paths` for `@/*`
- **MSW** for Query/`fetcher` HTTP in component suites — [MSW in this repo](#msw-in-this-repo)
- Scripts: `pnpm test` (watch), `pnpm test:run` (CI/agents), `pnpm test:coverage` (`vitest run --coverage`), `pnpm test:inspect` (Chrome DevTools / Node inspector)
- Coverage: `@vitest/coverage-v8` — [Coverage](https://vitest.dev/guide/coverage.html); reports under `coverage/` (gitignored)
- **Vitest backlog freeze & coverage ratchet** (until [`.cursor/plans/vitest_test_backlog_c23a3686.plan.md`](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md) is finished) — [below](#vitest-backlog-freeze--coverage-ratchet)
- VS Code: recommend `vitest.explorer`; launch configs in [`.vscode/launch.json`](../.vscode/launch.json)
- Colocated `*.test.ts` / `*.test.tsx` (**Vitest only**; never `*.spec.*`) — **same extension as the source** (`foo.ts` ↔ `foo.test.ts`, `foo.tsx` ↔ `foo.test.tsx`). `.tsx` only when the **test file** contains JSX — not because the subject is a hook or uses Testing Library. [`conventions.md`](./conventions.md) · [`project-structure.md`](./project-structure.md)
- Explicit Vitest imports (no `globals`); `vi.*` only (Jest is never used here)
- **Expects follow execution order** — hard rule; [below](#expects-follow-execution-order-hard-rule)
- ESLint on `**/*.test.{ts,tsx}` (not `e2e/`): [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest) (`recommended` + repo extras) + [`eslint-plugin-jest-dom`](https://github.com/testing-library/eslint-plugin-jest-dom) (`flat/recommended`) + [`eslint-plugin-testing-library`](https://github.com/testing-library/eslint-plugin-testing-library) (`flat/react`) — runner hygiene, prefer jest-dom matchers, and Testing Library query/async practices; rationale in [Vitest lint & config choices](#vitest-lint--config-choices) · [`eslint.config.mjs`](../eslint.config.mjs)
- Suffix split: `*.test.*` = Vitest (colocated only — no `__tests__/` / `tests/` / root `test/`), `e2e/*.spec.*` = Playwright ([why not `tests/`](#playwright-folder-e2e-not-tests)) — [enforced](#vitest-lint--config-choices)
- Bug fixes: [reproduce with a failing test first](#fixing-bugs-with-tests-agents)

### Test-only helpers (`lib/testing/`)

Helpers that exist **only** to serve suites live in [`lib/testing/`](../lib/testing/) — not loose in `lib/`, where they read like shipped app code.

- **Import from suites and Vitest setup only.** ESLint `no-restricted-imports` bans `@/lib/testing/**` everywhere except `**/*.test.{ts,tsx}`, `lib/testing/**` (siblings), and [`vitest.setup.ts`](../vitest.setup.ts) (MSW lifecycle) — [`eslint.config.mjs`](../eslint.config.mjs).
- **Group by concern.** Nest under a library/domain folder when the helper is tied to one stack (e.g. [`lib/testing/zod/`](../lib/testing/zod/) for Zod `safeParse` helpers, [`lib/testing/tanstack-query/`](../lib/testing/tanstack-query/) for Query render wrappers). Keep the `lib/testing/` root for truly cross-cutting helpers — don’t invent empty sibling folders early.
- **Cover executable helper logic.** `lib/testing/**` stays in [`vitest.config.mts`](../vitest.config.mts) coverage; test-only location controls imports, not whether branches deserve verification.
- **Still Vitest-tested.** Each helper keeps a colocated `*.test.ts` (same colocation rule as everywhere else).
- **Add one only when a pattern repeats.** Today: [`safe-parse-field-errors.ts`](../lib/testing/zod/safe-parse-field-errors.ts) (narrow a failed Zod `safeParse` → `fieldErrors`), [`default-issue-messages.ts`](../lib/testing/zod/default-issue-messages.ts) (Zod English default **issue messages** derived from a failed parse, so schema suites don’t hardcode copy), [`get-mock-result.ts`](../lib/testing/unsplash/get-mock-result.ts) (`UnsplashGetMockResult` + network-error payload for mocked `unsplash.GET`), [`next/image.tsx`](../lib/testing/next/image.tsx) (plain `<img>` drop-in — `vi.mock("next/image", () => import("@/lib/testing/next/image"))`), [`tanstack-query/render-with-query.tsx`](../lib/testing/tanstack-query/render-with-query.tsx) (`QueryClientProvider` + `invalidateQueries` spy), [`msw/`](../lib/testing/msw/) (`setupServer` + card HTTP handler helpers; lifecycle in [`vitest.setup.ts`](../vitest.setup.ts) — not a top-level `mocks/` folder), and [`factories/`](../lib/testing/factories/) (**Fishery** test data factories — e.g. `cardWithListFactory.build()`; not Vitest `test.extend` fixtures, not a top-level `factories/` tree yet). Prefer plain code in the suite until repetition is real.
- **Zod default issue-message names** ([`default-issue-messages.ts`](../lib/testing/zod/default-issue-messages.ts)): `{issueCodeInCamelCase}{ExpectedKind}` — camelCase of Zod’s issue `code`, then the expected type/format (e.g. `invalid_type` + string → `invalidTypeString`; `too_small` + string → `tooSmallString`; `invalid_format` + url → `invalidFormatUrl`). JSDoc cites the Zod `code`. Don’t invent parallel terms like “missing” when Zod says `invalid_type`.
- **`invalid_type` vs “missing”.** Zod has no separate missing-field issue. Omitting a required key (or passing `undefined`) is still `invalid_type`, with an issue message like `… received undefined`. That is what `invalidTypeString` / `invalidTypeNumber` / … capture. The same `code` applies when the value is present but the wrong type (`… received number`, etc.) — **same code, different issue message** — so those helpers must not be used for wrong-type cases.
- **Not a suite folder.** `lib/testing/` holds helpers; cases stay colocated with the module under test ([`project-structure.md`](./project-structure.md)).

### MSW in this repo

HTTP mocks for **Vitest** component + Query suites. Prefer MSW over ad-hoc `vi.stubGlobal("fetch", …)` when the UI under test goes through real `fetcher` / network (thin factory unit suites may still stub `fetch` — e.g. [`lib/api/card.test.ts`](../lib/api/card.test.ts)). Match the installed `msw` major — [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs).

**Official entrypoints (version-matched):** [Quick start](https://mswjs.io/docs/quick-start/) · [Best practices](https://mswjs.io/docs/best-practices/) · [Structuring handlers](https://mswjs.io/docs/best-practices/structuring-handlers/) · [Avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions/).

**Our wiring (repo SoT wins on conflicts):**

| Do                                                                                                                                             | Don’t                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the Node server under [`lib/testing/msw/`](../lib/testing/msw/) (`server.ts`, domain handler helpers)                                     | Invent a top-level `mocks/` / `src/mocks/` tree — tutorials often use that name; we avoid it ([`project-structure.md`](./project-structure.md))                                                                                                                                                      |
| Lifecycle in [`vitest.setup.ts`](../vitest.setup.ts): `listen` → `resetHandlers` (with RTL `cleanup`) → `close`; `onUnhandledRequest: "error"` | Start a second `setupServer` per suite, or leave unhandled requests silent                                                                                                                                                                                                                           |
| Override per test with `server.use(...)` (happy path vs error/pending)                                                                         | Assert that a particular request “was made” / spy MSW handlers as the main check — assert **UI** reaction ([Avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions/)); house example: [`card-modal/index.test.tsx`](../components/modals/card-modal/index.test.tsx) |
| Use MSW for our BFF / `fetcher` URLs (e.g. `/api/cards/...`)                                                                                   | Force MSW onto every remote — Unsplash goes through `unsplash-js` today; keep `vi.mock("@/lib/unsplash")` until that read moves to Query/`lib/api` ([`docs/data.md`](./data.md))                                                                                                                     |

Default [`handlers`](../lib/testing/msw/handlers.ts) may stay empty; compose with `server.use` + helpers (MSW allows `setupServer()` with no base handlers). Grow domain modules under `lib/testing/msw/` when repetition appears — same “add one only when a pattern repeats” rule as other `lib/testing/` helpers.

### Fixing bugs with tests (agents)

When fixing a bug in code that Vitest owns ([what to test where](#what-to-test-where)):

1. Write a **failing** colocated test that reproduces the bug.
2. Fix the **implementation** (not the test) until the test passes.
3. Keep the test as a regression guard.

Do **not** “fix” by weakening assertions or deleting the repro. Prefer real behavior over mocks unless the dependency is slow/flaky/side-effectful ([Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html#fixing-bugs-with-tests)).

If the bug needs the real app (Clerk, Stripe Checkout UI, async RSC, multi-page flows), use Playwright when added — don’t force a Vitest suite for that class of bug.

### Vitest terms & naming

Use **Vitest’s words** in docs, PR review, and chat — not near-synonyms from other runners. Match the installed major ([`conventions.md`](./conventions.md#match-installed-official-docs)). Authoring SoT: [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) · [Testing in Practice](https://vitest.dev/guide/learn/testing-in-practice.html) · [API](https://vitest.dev/api/).

#### Core terms

| Term                   | What Vitest means                                                                             | Notes for this repo                                                                                                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test**               | One case defined with `test(…)` (or alias `it`)                                               | We use **`test` only** (`consistent-test-it`) — [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html)                                                                                                                                                        |
| **Test name**          | The string (or function whose `.name` is used) passed as the first argument to **`test`**     | Official term is **name**, not “title”. Applies to **`test` only** — not to `describe`. API: [`test`](https://vitest.dev/api/#test) · [Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) (“Each test has a **name**…”)                                    |
| **Suite**              | A named group of tests created with `describe`                                                | Prefer one `describe` per unit under test; keep nesting shallow — [Grouping with describe](https://vitest.dev/guide/learn/writing-tests.html#grouping-tests-with-describe) · [Organizing](https://vitest.dev/guide/learn/testing-in-practice.html#grouping-with-describe) |
| **Suite name**         | The string (or function whose `.name` is used) passed as the first argument to **`describe`** | Names the suite in the reporter (`file > suite > test`). Do **not** call this a “test name.”                                                                                                                                                                              |
| **Assertion**          | A check via `expect(…)` (and matchers)                                                        | At least one per test — we set `expect.requireAssertions: true`. **Order:** [expects follow execution order](#expects-follow-execution-order-hard-rule)                                                                                                                   |
| **Matcher**            | The expectation method (`toBe`, `toStrictEqual`, `toThrow`, …; jest-dom adds DOM matchers)    | Prefer `toStrictEqual` over `toEqual` ([lint](#vitest-lint--config-choices)); jest-dom matchers in component tests                                                                                                                                                        |
| **Test file**          | A file Vitest collects (our include: colocated `*.test.*` only)                               | Never `*.spec.*` for Vitest; never suite folders — see [lint & config](#vitest-lint--config-choices)                                                                                                                                                                      |
| **Hook**               | Lifecycle helpers: `beforeEach` / `afterEach` / `beforeAll` / `afterAll`                      | Prefer fresh setup per test when cheap; hooks when repetition hurts                                                                                                                                                                                                       |
| **Parameterized test** | Same body, many rows — **`test.for` only** (`test.each` / `describe.each` fail ESLint)        | Interpolate the **test name** with `$field` / printf placeholders — [Parameterized Tests](https://vitest.dev/guide/learn/writing-tests.html#parameterized-tests) · [lint table](#vitest-lint--config-choices)                                                             |
| **Test context**       | Second arg to the test fn (`{ expect, … }`) / fixtures via `test.extend`                      | Needed for concurrent snapshots; optional otherwise                                                                                                                                                                                                                       |
| **`vi`**               | Vitest’s mocking / spying / timer API                                                         | **`vi.*` only** — never `jest.*`                                                                                                                                                                                                                                          |
| **Test double**        | Umbrella for stub / mock / spy — any stand-in for a real dependency                           | Not a Vitest API word. Definitions + examples: [Test doubles](#test-doubles-stub-vs-mock-vs-spy)                                                                                                                                                                          |
| **Fake timers**        | `vi.useFakeTimers` / `vi.setSystemTime` for time-dependent code                               | Prefer over real `setTimeout` waits when asserting time                                                                                                                                                                                                                   |
| **Snapshot**           | `toMatchSnapshot` / `toMatchInlineSnapshot`                                                   | Use sparingly; prefer explicit asserts for domain copy                                                                                                                                                                                                                    |
| **Environment**        | Where the file runs (`node`, `jsdom`, browser provider, …)                                    | Default **jsdom** for components; pure `*.test.ts` still fine under that config                                                                                                                                                                                           |
| **Coverage**           | Which source lines ran under tests (`v8` provider here)                                       | `pnpm test:coverage` · scoped: `pnpm test:coverage:paths`                                                                                                                                                                                                                 |
| **Reporter**           | How results are printed / exported                                                            | Default terminal output is enough locally; CI may add more later                                                                                                                                                                                                          |

**Do not say “test title.”** Say **test name** (first argument to `test`) or **suite name** (first argument to `describe`).

**Test type** (unit / component / E2E / …) is a **repo** word for ownership — [Test types (vocabulary)](#test-types-vocabulary) — not a Vitest API term.

#### Test doubles: stub vs mock vs spy

**Test double** is the umbrella word for any fake you swap in for a real dependency. Vitest’s docs call almost all of them “mocking” ([Mocking](https://vitest.dev/guide/mocking.html)) and only use “stub” for [`vi.stubEnv`](https://vitest.dev/api/vi.html#vi-stubenv) / [`vi.stubGlobal`](https://vitest.dev/api/vi.html#vi-stubglobal) — so the distinction below is **our vocabulary** for review conversations, not a Vitest API split.

The three differ by **what the test does with the double**, not by which `vi.*` function created it:

| Double   | Purpose                                                      | Does the double appear in an `expect`? | Typical API                                         |
| -------- | ------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------- |
| **Stub** | Let the code **run** (satisfy an import / constructor / env) | **No** — you assert on the real output | `vi.mock` factory, `vi.stubEnv`, `vi.stubGlobal`    |
| **Mock** | Record calls on a fake **you supplied**                      | **Yes** — `toHaveBeenCalledWith(…)`    | `vi.fn`, `vi.mock` factory returning `vi.fn()`      |
| **Spy**  | Watch a function that **already exists** on a real object    | **Yes**                                | `vi.spyOn` (keeps real impl unless you override it) |

**Server Action mocks (`createSafeAction`):** Use a bare `vi.hoisted(() => vi.fn())` and `mockResolvedValue({ data })` / `{ serverError }` / `{ fieldErrors }` per test. Do **not** give the factory a success-only return type (narrows inference). Skip shared helpers / `ActionState`+`Pick` ceremony for this — call-site typing on action mocks is not worth it here.

**Stub — in this repo today.** `lib/stripe.ts` constructs a Stripe client at module load, which would demand `STRIPE_SECRET_KEY`. The fake class exists only so the import succeeds; no test mentions it:

```5:11:lib/stripe.test.ts
vi.mock("stripe", () => ({
  default: class Stripe {
    constructor() {
      // Avoid needing STRIPE_SECRET_KEY when importing helpers under test.
    }
  },
}));
```

The assertions target the real helpers (`toStripeUnitAmount`, `toStripeCurrency`), never the fake.

**Mock — the shape our first Prisma suite uses** ([`lib/create-audit-log.test.ts`](../lib/create-audit-log.test.ts)). Here the point _is_ the call: we verify the row we would have written, without a database.

```ts
// lib/prisma.ts exports the client as `default`
vi.mock("@/lib/prisma", () => ({
  default: { auditLog: { create: vi.fn() } },
}));

test("writes an audit log row for the action", async () => {
  await createAuditLog({ entityId: "board_1", action: ACTION.CREATE /* … */ });

  expect(prisma.auditLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ entityId: "board_1" }),
    }),
  );
});
```

**Spy — when the real function should stay reachable.** `vi.spyOn` wraps something that already exists, so you can assert calls and still let the original run (or replace it for one test):

```ts
const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

renderBoardList({ boards: [] });

expect(warn).toHaveBeenCalledOnce();
```

**Rule of thumb:** if you can delete the double from your mental model of the assertion, it’s a **stub**. If the assertion names it, it’s a **mock** (you created the fake) or a **spy** (you wrapped an existing function).

**Coverage note:** doubles live in the test file, so they never add coverage themselves. A stub can still make source lines run — importing `./stripe` with the Stripe stub executes the `new Stripe(...)` line in [`lib/stripe.ts`](../lib/stripe.ts) — but that measures **our** module, not the vendor SDK.

`restoreMocks` / `mockReset` / `unstubGlobals` / `unstubEnvs` ([config](#vitest-lint--config-choices)) cover spy restore, `vi.fn()` history+impl reset, and stub undo between tests — don’t re-add the same cleanup in every suite’s `beforeEach` / `afterEach`.

#### Calling `queryFn` from `queryOptions` in unit tests

Resource **factories** ([`lib/api/card.ts`](../lib/api/card.ts); term: [`vocabulary.md`](./vocabulary.md)) build options with [`queryOptions`](https://tanstack.com/query/v5/docs/framework/react/guides/query-options). TanStack types `queryFn` as a function that takes a **`QueryFunctionContext`** (and the property may be optional). Our factories usually **ignore** that context — they close over `id` and call `fetcher` — so a unit test that invokes `queryFn` directly to assert the URL / payload hits a TypeScript mismatch: “expected 1 argument” / “possibly undefined.”

**Pattern** (example: [`lib/api/card.test.ts`](../lib/api/card.test.ts)):

1. Stub `fetch` (or mock `fetcher`) so the call is hermetic.
2. Assert `queryFn` is present if needed, then **cast only the call shape** so you can invoke with no args.
3. Await the result, then assert in **execution order** (fetch → body) — [expects follow execution order](#expects-follow-execution-order-hard-rule).

```ts
const { queryFn } = cardQueries.detail("card_1");
// Cast fixes arity for tsc; queryFn ignores QueryFunctionContext. See docs/testing.md.
const body = await (queryFn as () => Promise<unknown>)();

expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
expect(body).toStrictEqual(card);
```

**Return type on the cast — `unknown` vs accurate vs `any`:**

| Choice                                | When                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Promise<unknown>` (default)          | Cast is only about **call shape**; the matcher already checks the value. Neutral / safe.  |
| Accurate (`Promise<CardWithList>`, …) | Fine if you want the cast to document the factory’s result type — optional, not required. |
| `any`                                 | Avoid. Turns off checking on the expression; later use of the value won’t catch mistakes. |

`unknown` means “a value, type not claimed yet” — you must narrow before using it. `any` means “skip the type checker for this.” Prefer `unknown` (or the accurate type) over `any` for throwaway casts. Handbook: [TypeScript — `unknown`](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown) · [`any`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any).

Full Query / cache / UI behavior stays in component + MSW tests ([what to test where](#what-to-test-where)) — this pattern is only for thin factory unit suites.

#### How we name tests

Follow Vitest ([Descriptive Names](https://vitest.dev/guide/learn/testing-in-practice.html#descriptive-names) · [Naming Tests](https://vitest.dev/guide/learn/testing-in-practice.html#naming-tests) · [Testing Edge Cases](https://vitest.dev/guide/learn/testing-in-practice.html#testing-edge-cases)):

1. Describe **behavior / outcome**, not implementation (`"Free plan is limited"`, not `"calls hasUnlimitedBoards with FREE_PLAN"`).
2. When the test fails, the **test name** alone should say what broke — output should read like a **specification** of the module.
3. **One behavior per test.** “And” in a name usually means split.
4. Under a `describe("fn")`, keep names short; the suite already scopes the subject.
5. **Don’t oversample the same branch.** Cover the main contract, **boundaries**, and **error paths** — not every valid input that hits identical logic (e.g. one positive `maxBoards` is enough for `formatBoardLimit`; keep `0` / `-1` / non-integers as rejects).

**Repo extras** (examples: [`constants/pricing-plans.test.ts`](../constants/pricing-plans.test.ts) · [`actions/*/schema.test.ts`](../actions/)):

- Prefer **domain wording** for outcomes (`limited` / `unlimited`) over raw assertion echo (`is false` / `is true`) when both are clear.
- When a suite (or parameterized table) splits happy-path vs rejection, prefix the **test name** with **`valid:`** / **`invalid:`**, then the behavior — e.g. `valid: accepts a copy payload`, `invalid: requires id and boardId`, `valid: formats maxBoards=1 as Up to 1 boards`, `invalid: throws when maxBoards is not a positive integer (-1)`.
- Interpolate case data in parameterized **test names** (`$maxBoards`, `$expected`, `$0`) so the reporter shows which row failed.

#### Expects follow execution order (hard rule)

**Must:** after the act under test, write `expect(…)` in the **same order the code ran** — calls and side effects first, then resulting state / return value. The test body should read like a short timeline of the behavior.

| Prefer                                                      | Avoid                                    |
| ----------------------------------------------------------- | ---------------------------------------- |
| `action` → `onSuccess` → `onComplete` → settled `isLoading` | Settled `isLoading` first, `action` last |
| `fetch` → `json` → body                                     | Body first, then `fetch` / `json`        |
| `handler` called (or not) → returned `ActionState`          | Result first, then “was handler called?” |

```ts
// hooks/use-action.test.ts — success path
await act(async () => {
  await result.current.execute({ title: "Roadmap" });
});

expect(action).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
expect(result.current.data).toStrictEqual({ id: "board_1" });
expect(onSuccess).toHaveBeenCalledExactlyOnceWith({ id: "board_1" });
expect(onError).not.toHaveBeenCalled();
expect(onComplete).toHaveBeenCalledOnce();
expect(result.current.isLoading).toBe(false);
```

```ts
// lib/fetcher.test.ts — happy path
const body = await fetcher<{ id: string }>("/api/cards/card_1");

expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
expect(json).toHaveBeenCalledOnce();
expect(body).toStrictEqual({ id: "card_1" });
```

**Why:** failures and reviews match the implementation story (`onSuccess` then `onComplete` in [`use-action.ts`](../hooks/use-action.ts)). Order does not change pass/fail for independent matchers, but wrong order is a **repo convention violation** — fix it in review.

**When there is only one assert** (pure return, schema `safeParse` shape, store field), order is moot. **When several asserts span calls + state**, chronological order is required. Prefer `const result = await …` + ordered expects over `await expect(…).resolves…` then a mock assert that happened earlier — unless a single `rejects`/`resolves` is the whole test.

Examples already following this: [`hooks/use-action.test.ts`](../hooks/use-action.test.ts) · [`lib/fetcher.test.ts`](../lib/fetcher.test.ts) · [`lib/create-safe-action.test.ts`](../lib/create-safe-action.test.ts) · [`lib/create-audit-log.test.ts`](../lib/create-audit-log.test.ts) · [`lib/api/card.test.ts`](../lib/api/card.test.ts).

### Vitest lint & config choices

Why we set these (not just what). Enforcement lives in [`vitest.config.mts`](../vitest.config.mts) and [`eslint.config.mjs`](../eslint.config.mjs). Prefer official docs for the installed Vitest / plugin versions ([`conventions.md`](./conventions.md)).

| Choice                                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Reference                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setupFiles` → [`vitest.setup.ts`](../vitest.setup.ts) + jest-dom       | **Problem:** component tests need DOM asserts; Vitest matchers aren’t DOM-aware and Testing Library doesn’t ship matchers. **Fix:** jest-dom (ecosystem companion). Wire once via `import "@testing-library/jest-dom/vitest"` — not the default Jest entry. **No `tsconfig` change:** setup is already in `"include": ["**/*.ts"]`; skip official `"types": ["vitest/globals", "@testing-library/jest-dom"]` — we don’t use Vitest globals, and the default jest-dom types target Jest (the `/vitest` import augments Vitest instead). | [Why above](#already-following) · [jest-dom → With Vitest](https://github.com/testing-library/jest-dom#with-vitest) · [setupFiles](https://vitest.dev/config/setupfiles)                                                                                                    |
| `@testing-library/user-event` (dep only — no `setupFiles`)              | **Problem:** interactive tests need realistic click/type; `fireEvent` is one low-level dispatch. **Fix:** user-event (ecosystem companion). **Config:** none in Vitest — `import userEvent` + `userEvent.setup()` before `render` per test (v14 instance API). Prefer over `fireEvent`. Shared Query render wrapper: [`lib/testing/tanstack-query/render-with-query.tsx`](../lib/testing/tanstack-query/render-with-query.tsx).                                                                                                        | [Why above](#already-following) · [user-event intro](https://testing-library.com/docs/user-event/intro) · [ecosystem](https://testing-library.com/docs/dom-testing-library/install/#ecosystem)                                                                              |
| `restoreMocks: true`                                                    | Spies (`vi.spyOn`) often skip cleanup; restore original implementations between tests. Does **not** clear `vi.fn()` call history or reset scripted impls (`mockResolvedValue`, …) — see `mockReset`.                                                                                                                                                                                                                                                                                                                                   | [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) · [restoreMocks](https://vitest.dev/config/restoremocks.html)                                                                                                                            |
| `mockReset: true`                                                       | Clears call history **and** resets implementations on mocks/`vi.fn()` (what suites used to do with `foo.mockReset()` in `beforeEach`). Prefer this over `clearMocks` (history only — leaves `mockResolvedValue` leaks). Do **not** also enable `clearMocks`. Re-apply any default impl you need after reset (e.g. Unsplash fallback in FormPopover). Avoid `test.concurrent` with shared mocks (Vitest warning).                                                                                                                       | [mockReset](https://vitest.dev/config/mockreset.html) · [vi.resetAllMocks](https://vitest.dev/api/vi.html#vi-resetallmocks)                                                                                                                                                 |
| `unstubGlobals: true` · `unstubEnvs: true`                              | `restoreMocks` does **not** undo `vi.stubGlobal` / `vi.stubEnv`; auto-unstub before each test so suites don’t need `afterEach` → `vi.unstubAllGlobals` / `vi.unstubAllEnvs`. Avoid `test.concurrent` with global/env stubs (Vitest warning).                                                                                                                                                                                                                                                                                           | [unstubGlobals](https://vitest.dev/config/unstubglobals.html) · [unstubEnvs](https://vitest.dev/config/unstubenvs.html) · [vi.stubGlobal](https://vitest.dev/api/vi.html#vi-stubglobal)                                                                                     |
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
| `consistent-each-for` → `.for`                                          | **`test.for` / `describe.for` only** — `.each` fails lint (Jest-compat; Vitest prefers `.for` + test context). Options required or the rule is a no-op.                                                                                                                                                                                                                                                                                                                                                                                | [Parameterized Tests](https://vitest.dev/guide/learn/writing-tests.html#parameterized-tests) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-each-for.md) · [`eslint.config.mjs`](../eslint.config.mjs)                         |
| `hoisted-apis-on-top`                                                   | `vi.mock` / `vi.hoisted` are hoisted — keep them at the top of the file                                                                                                                                                                                                                                                                                                                                                                                                                                                                | [vi.mock](https://vitest.dev/api/vi.html#vi-mock) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/hoisted-apis-on-top.md)                                                                                                                  |
| `no-alias-methods`                                                      | Prefer full matcher names (`toHaveBeenCalled`) over aliases (`toBeCalled`)                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-alias-methods.md)                                                                                                                                                                         |
| `prefer-strict-equal`                                                   | Prefer **`toStrictEqual`** over `toEqual` (catches `undefined` keys, sparse arrays, class vs plain object). Use `toEqual` only when the looser compare is intentional                                                                                                                                                                                                                                                                                                                                                                  | [toStrictEqual](https://vitest.dev/api/expect.html#tostrictequal) · [rule](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-strict-equal.md)                                                                                                  |
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

- [x] First colocated suite(s) — pure `lib/` helpers + Zod `actions/*/schema.ts` (P0).
- [x] Mocked I/O / stores / `use-action` / first Prisma Client mock (`create-audit-log`) (P1). Remaining Vitest backlog (P4 polish): [`.cursor/plans/vitest_test_backlog_c23a3686.plan.md`](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md)
- [x] Client component suites (jest-dom for DOM asserts; `userEvent.setup()` for interactions) — plan P2
- [ ] Drop `vite-tsconfig-paths` for Vite native `resolve.tsconfigPaths` if the deprecation warning stays noisy
- [x] MSW when a Query-backed UI needs HTTP mocks — [`lib/testing/msw/`](../lib/testing/msw/) + lifecycle in [`vitest.setup.ts`](../vitest.setup.ts) · [`conventions.md`](./conventions.md) · plan P3
- [ ] Playwright for critical flows (auth, board, billing) — `e2e/*.spec.ts` only (never `*.test.*`; only E2E tool; no Cypress)
- [ ] Storybook when [catalog triggers](#storybook-when-needed) pass — catalog/workshop only; colocated `*.stories.tsx` (not CI component-test owner unless [decision record](#decision-record-vitest--jsdom--browser-mode--playwright--storybook) rewritten)
- [ ] Revisit Vitest Browser Mode only if [triggers](#trigger-checklist-for-switching-the-component-default) fire — pilot jsdom vs Browser Mode before blanket switch; update decision record + config together
- [ ] CI: run `pnpm test:run` on PRs; keep coverage ratchet / thresholds per [backlog freeze](#vitest-backlog-freeze--coverage-ratchet) (full threshold tighten still P4)
- [ ] `@vitest/ui` (`vitest --ui` / optional `html` reporter) when browser suite exploration or CI HTML reports beat the VS Code Testing view — [Vitest UI](https://vitest.dev/guide/ui.html)
- [ ] Tighten `coverage.include` / Vitest `thresholds` once the backlog is done — plan P4 (ratchet while the backlog runs is manual + plan ledger, not config yet)
- [x] **Follow-up (after Vitest P0):** [`eslint-plugin-zod`](https://github.com/marcalexiei/eslint-plugin-zod) stock `recommended` in [`eslint.config.mjs`](../eslint.config.mjs) — namespace `import * as z from "zod"`, `*Schema` names, string `.trim()` ([one tool per job](./vocabulary.md#one-tool-per-job): lint aid, not a second schema stack). Authoring notes: [`conventions.md`](./conventions.md)

## Vitest backlog freeze & coverage ratchet

**Hard rules while** [`.cursor/plans/vitest_test_backlog_c23a3686.plan.md`](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md) **is unfinished** (P4 still open):

1. **No new product features** — no new user-facing capability, schema/API surface, or parallel “while we’re here” product work. Allowed:
   - Tests, test doubles, docs/plans
   - Tiny production fixes **forced by a failing test** (TDD / regression)
   - Backlog-listed cleanups (e.g. FormData casts after their suites)
   - **Store / Query hygiene** paired with a colocated suite in the same P — e.g. derive a `select*` instead of a duplicate flag, move inline `useQuery({ queryKey, queryFn })` into a [`lib/api/`](../lib/api/) resource factory, or ESLint that enforces those exports. Must stay behind the suite’s peer(s); not a license for unrelated refactors or new product surface. P1 examples: [`selectCardModalIsOpen`](../stores/use-card-modal-store.ts), [`lib/api/card.ts`](../lib/api/card.ts).
2. **New `*.test.*` → 100% on its colocated peer(s)** — for every new (or expanded) suite, the source file(s) that suite owns must reach **100%** statements, branches, functions, and lines under V8. Check with `pnpm test:coverage:paths <peer>` (or scoped `--coverage.include`). Do **not** count incidental imports (e.g. store tests importing `create-store`) as “owned” unless you add a dedicated colocated suite for that module. **`test:coverage:paths` pairs by the same file extension** (`foo.ts` ↔ `foo.test.ts`, `foo.tsx` ↔ `foo.test.tsx`) — a `.tsx` suite for a `.ts` source does not resolve (P1: [`hooks/use-action.test.ts`](../hooks/use-action.test.ts)).
3. **End of each P → overall coverage must rise** — **after the P merges** (not mid-review), run `pnpm test:coverage` and record the **All files** summary (stmts / branch / funcs / lines) in the backlog plan’s [coverage ledger](../.cursor/plans/vitest_test_backlog_c23a3686.plan.md). Each closed P must be **strictly higher** on overall **statements** (and should not regress the other three) vs the previous closed P’s ledger row. Do **not** game the ratchet by shrinking `coverage.include` mid-backlog. **Live numbers** are not stored in git — regenerate with `pnpm test:coverage` and open gitignored [`coverage/`](../coverage/) (see [Coverage reports](#coverage-reports-vitest-output)).

When the backlog is marked done, drop the feature freeze; keep colocated 100% as the default for new suites unless a concern doc says otherwise; move formal Vitest `thresholds` / include tightening to P4 (or a follow-up).

### Coverage reports (Vitest output)

Vitest does **not** keep a checked-in “current coverage” file. After `pnpm test:coverage` (or `test:coverage:paths`), it writes under **`coverage/`** (gitignored — [`.gitignore`](../.gitignore)):

| Artifact                                        | Use                                                   |
| ----------------------------------------------- | ----------------------------------------------------- |
| [`coverage/index.html`](../coverage/index.html) | Browse overall + per-file (human)                     |
| `coverage/coverage-final.json`                  | Machine-readable detail (default `json` reporter)     |
| `coverage/clover.xml`                           | Default `clover` reporter (CI/tools)                  |
| Terminal **text** summary                       | Printed by the run — no file unless you add reporters |

Defaults: [Vitest coverage](https://vitest.dev/guide/coverage.html) · `reportsDirectory` default `./coverage`. Re-run to refresh; do not commit `coverage/`. The backlog **ledger** is the durable human snapshot **after merge**, not a substitute for regenerating the report.

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
3. **Hook via `renderHook`, no JSX in the suite?** → **Vitest** + Testing Library + **jsdom**, file suffix **matches the source** (`use-action.ts` → `use-action.test.ts`). Do **not** use `.tsx` just because it’s a hook.
4. **One client component — assert behavior?** (render, click, type, empty/error UI as DOM assertions) → **Vitest component** (`*.test.tsx` + Testing Library + **jsdom**). Use Browser Mode only if [triggers](#trigger-checklist-for-switching-the-component-default) / an explicit opt-in pilot say so — not because Vitest’s component guide prefers it.
5. **Client UI that talks HTTP via Query?** → still **Vitest**, mock HTTP with **MSW** when needed (not Playwright).
6. **Humans need a browsable gallery of UI variants?** → **Storybook** only when [triggers](#storybook-when-needed) pass — not for CI assertions of the same behavior.
7. **Pixel / screenshot diff?** → **Playwright** until a Storybook visual workshop is deliberately adopted (then pick **one** visual system).

```text
Needs full app / real browser product? ──yes──► Playwright
         │ no
Pure function / schema? ──yes──► Vitest unit (Node)
         │ no
Hook via renderHook (no JSX)? ──yes──► Vitest + jsdom · *.test.ts matching source
         │ no
Component behavior (JSX in suite)? ──yes──► Vitest + jsdom · *.test.tsx (+ MSW if HTTP)
         │                                      └─ Browser Mode only if triggers / pilot
Catalog for humans? ──yes──► Storybook (when triggered; not CI assert owner)
         │ no
Visual regression only? ──yes──► Playwright (for now)
```

### Test types (vocabulary)

| Test type                   | What you are checking                                        | Runs in                  | **Tool here**                                                                        | Typical files                | Examples                                                                                            |
| --------------------------- | ------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Unit**                    | One function/module in isolation — inputs → outputs / throws | Node (Vitest)            | **Vitest**                                                                           | `foo.test.ts` next to module | `actions/*/schema.ts`, `lib/fetcher.ts`, `lib/paths.ts`, `lib/generate-log-message.ts`              |
| **Hook (`renderHook`)**     | Hook state/callbacks without mounting component JSX          | jsdom                    | **Vitest** + Testing Library                                                         | `foo.test.ts` (match source) | [`hooks/use-action.test.ts`](../hooks/use-action.test.ts) — **not** `.tsx` unless the suite has JSX |
| **Component (static)**      | Given props, the right roles/text/structure appear           | jsdom                    | **Vitest** + Testing Library                                                         | `foo.test.tsx`               | Modal header title, disabled submit, empty list copy                                                |
| **Component (interactive)** | User events change UI or call callbacks                      | jsdom + synthetic events | **Vitest** + Testing Library + `user-event`                                          | `foo.test.tsx`               | Type board title, open/close modal via store, toggle sidebar                                        |
| **Component + HTTP**        | Query/UI with mocked network (not the real API)              | jsdom + MSW              | **Vitest** + MSW                                                                     | `foo.test.tsx`               | Card modal fetch success/error with MSW handlers                                                    |
| **E2E (end-to-end)**        | A real user journey through the deployed/dev app             | Real browser             | **Playwright**                                                                       | `e2e/*.spec.ts`              | Sign-in → create board → add card → open billing                                                    |
| **Visual regression**       | Pixels / layout look unchanged (or intentionally changed)    | Real browser             | **Playwright** screenshots **for now**; Storybook/Chromatic only if workshop trigger | `e2e/` or later stories      | Optional smoke screenshot of board canvas                                                           |
| **Accessibility checks**    | Axe/roles issues on a unit of UI or a page                   | jsdom and/or browser     | Prefer **Vitest** for isolated components; **Playwright** for full pages             | colocated or `e2e/`          | Form missing label; dashboard a11y smoke                                                            |
| **Story / catalog**         | Document and browse UI states for humans                     | Storybook app            | **Storybook** (when needed)                                                          | `foo.stories.tsx`            | All `CardModal` variants side by side — **not** a duplicate of the Vitest suite                     |

**Not separate runners here:** “integration” is overloaded. A Vitest test that renders a component with MSW is still **Vitest** (component + HTTP). We do **not** add a third harness named integration.

### Static vs interactive (both Vitest)

|           | Static component test               | Interactive component test                         |
| --------- | ----------------------------------- | -------------------------------------------------- |
| Acts like | Snapshot of the tree after `render` | User clicking/typing                               |
| Assert    | Roles, text, attributes             | Outcomes after `userEvent`                         |
| Use when  | Props → markup                      | Behavior matters                                   |
| Still     | Vitest + Testing Library + jest-dom | Vitest + Testing Library + jest-dom + `user-event` |

### Prop coverage (component suites)

When writing or extending a Vitest suite for a component, **exercise every prop** on its public props type — including `ref`, optional pass-throughs (`className`, `variant`, …), and event handlers. Bundle pure attribute forwards in one test if that stays readable; do **not** skip a prop because it “only forwards.” That is how broken `ref` / className / variant wiring ships unnoticed.

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

**Model / entity test data (typing + sharing):**

- **Complete object** — has every field the production type needs: do **not** use `as Model` or `satisfies Model`. Pass the plain object; the typed call site already checks assignability.
- **Shared Fishery factories when shapes repeat** — do **not** copy the same `CardWithList` / `AuditLog` object into every suite, and do **not** hand-roll parallel `make*` helpers. Prefer [`lib/testing/factories/`](../lib/testing/factories/) (`Factory.define` → `.build({ …overrides })`). Thin `{ id, boardId }` action inputs stay local. Don’t confuse with Vitest/Playwright **fixtures** (`test.extend` lifecycle). Don’t add `@faker-js/faker` until random/unique values actually hurt.
- **Intentional partial** — production takes a **full** model type but the test only cares about a few fields: keep the production param as the model type; in the test use a **named cast** helper that accepts `Pick<…>` and returns `as Model`. Do **not** invent unused columns only to please TypeScript. See `auditLogForMessage` in [`lib/generate-log-message.test.ts`](../lib/generate-log-message.test.ts).
- Zod schema suites and other plain-input unit tests do not need this pattern. Do not blanket-ban `as` — Clerk/auth mocks and similar partial stubs still need casts.

**Do not add `"type": "module"` to root [`package.json`](../package.json)** to “match” Prisma blog samples. Those samples are bare Node/Vitest packages. This app relies on Next.js, Vitest/Vite, and `node --import tsx` for scripts; forcing package-wide ESM can break CJS assumptions. Revisit only if a concrete Node entrypoint fails without it.

**Landed:** Client mock via inline `vi.mock` factory in [`lib/create-audit-log.test.ts`](../lib/create-audit-log.test.ts) (no `lib/__mocks__/prisma.ts` yet — add that file if multiple suites need the same stub). Types-only helpers still skip Client mocks.

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

| Script                     | When                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                | Local watch (humans)                                                                                                                              |
| `pnpm test:run`            | One-shot — agents, CI, pre-commit checks                                                                                                          |
| `pnpm test:coverage`       | One-shot with V8 coverage for the whole suite (`coverage/`) — [Coverage](https://vitest.dev/guide/coverage.html)                                  |
| `pnpm test:coverage:paths` | Coverage for colocated source ↔ `*.test.*` pair(s) (files and/or folders) — [`scripts/test-coverage-paths.ts`](../scripts/test-coverage-paths.ts) |
| `pnpm test:inspect`        | Pause for Chrome DevTools (`chrome://inspect`) — [Node inspector](https://vitest.dev/guide/debugging.html#node-inspector-e-g-chrome-devtools)     |

```bash
# Prefer this when inspecting modules (files and/or folders; recursive).
# Trailing slash on folders is optional (`lib` and `lib/` are the same).
pnpm test:coverage:paths constants/pricing-plans.ts
pnpm test:coverage:paths lib/paths.ts lib/utils.ts
pnpm test:coverage:paths lib constants
pnpm test:coverage:paths lib/paths.test.ts actions/create-board/

# Full-suite coverage
pnpm test:coverage

# Manual Vitest filters (extra args after the script name; do not insert `--` —
# pnpm would forward a literal `--` and break flags like --coverage.include)
pnpm test:run lib/paths.test.ts
pnpm test:coverage lib/paths.test.ts --coverage.include=lib/paths.ts
```

HTML report: `coverage/index.html` (gitignored). Details: [Coverage reports](#coverage-reports-vitest-output).

## Debug

1. **Preferred:** Testing view → **Debug Test** (`vitest.explorer`)
2. **F5 / Debug panel:** configs in [`.vscode/launch.json`](../.vscode/launch.json) — current file, current file (watch), all tests (`--test-timeout=0`, `--no-file-parallelism`)
3. **JavaScript Debug Terminal** + `pnpm test` — zero config
4. **`pnpm test:inspect`** + `chrome://inspect` — IDE-optional

## File map

| Path                                                                  | Role                                                                                                                                           |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [`vitest.config.mts`](../vitest.config.mts)                           | Vitest + `setupFiles` + `*.test.*` include + `restoreMocks` / `mockReset` / `unstubGlobals` / `unstubEnvs` + `requireAssertions` + V8 coverage |
| [`vitest.setup.ts`](../vitest.setup.ts)                               | jest-dom on Vitest `expect` — **why:** DOM asserts; see [Already following](#already-following)                                                |
| [`eslint.config.mjs`](../eslint.config.mjs)                           | `@vitest/eslint-plugin` + `eslint-plugin-jest-dom` + `eslint-plugin-testing-library` on Vitest suites ([above](#vitest-lint--config-choices))  |
| [`package.json`](../package.json)                                     | `test` scripts · `test:coverage:paths` · Testing Library deps (`jest-dom`, `user-event`, …)                                                    |
| [`scripts/test-coverage-paths.ts`](../scripts/test-coverage-paths.ts) | Colocated source/test (files or folders) → Vitest coverage for those pairs                                                                     |
| [`.vscode/extensions.json`](../.vscode/extensions.json)               | `vitest.explorer`                                                                                                                              |
| [`.vscode/launch.json`](../.vscode/launch.json)                       | Vitest debug launch configs                                                                                                                    |
| [`AGENTS.md`](../AGENTS.md)                                           | Short agent rules (point here for the full map)                                                                                                |
| `**/foo.test.ts(x)`                                                   | Colocated Vitest suites (never `*.spec.*`)                                                                                                     |
| `e2e/**/*.spec.ts(x)`                                                 | Playwright only (when added; never `*.test.*`)                                                                                                 |
