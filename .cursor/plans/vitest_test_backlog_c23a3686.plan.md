---
name: Vitest test backlog
overview: "P0 (PR #5) + P1 (PR #7) + P2 (PR #8) + P3 (PR #9) + P4 done. Freeze dropped. Post-P4: card 404, Query hardening (lib/tanstack-query/), board-limits colocation + atomic cap, action handler org-scoping + transactions, card modal remount, stripe-redirect. New *.test.* still 100% on colocated peers; All-files floors in vitest.config.mts."
todos:
  - id: branch-from-main
    content: Create a new branch from up-to-date main for P0 Vitest suites
    status: completed
  - id: p0-pure-unit
    content: "P0: Colocated unit tests for generate-log-message, paths, utils (incl. cssUrl), pricing helpers, stripe helpers, all 14 action schemas, create-safe-action, lib/testing/zod helpers; pnpm test:run green"
    status: completed
  - id: review-then-pr
    content: Self-review the P0 diff, then push and open PR to main
    status: completed
  - id: p1-mocked-unit
    content: "P1: fetcher, env, 3 Zustand stores, use-action; first Prisma Client mock (vi.mock factory) for create-audit-log + Clerk mocks; pnpm test:run green"
    status: completed
  - id: p2-components
    content: "P2: Form primitives + pro/mobile modals + board forms/options + form-popover + form-picker (incl. a11y TDD) + subscription-button + card-modal pieces; 100% colocated peers; raise overall coverage vs P1 ledger"
    status: completed
  - id: p2-form-picker-a11y
    content: "FormPicker a11y: failing colocated test first (keyboard reach/activate → onSelect), then fix div+onClick; use defaultImages (no MSW). See docs/testing.md Fixing bugs with tests"
    status: completed
  - id: p2-form-popover-controlled-title
    content: "FormPopover title: failing test first (value survives invalid submit), then make title controlled like selectedImage; drop FormData for title. See inline TODO in form-popover.tsx"
    status: completed
  - id: p2-formdata-board-title-form
    content: "board-title-form: colocated test covering submit → execute args, then replace formData.get as string with formDataString (docs/data.md)"
    status: completed
  - id: p2-formdata-list-form
    content: "list-form: colocated test covering submit → execute args, then replace formData.get as string with formDataString"
    status: completed
  - id: p2-formdata-list-header
    content: "list-header: colocated test covering submit → execute args, then replace formData.get as string with formDataString"
    status: completed
  - id: p2-formdata-list-options
    content: "list-options: colocated test covering both copy/delete submit handlers → execute args, then replace formData.get as string with formDataString"
    status: completed
  - id: p2-formdata-card-form
    content: "card-form: colocated test covering submit → execute args (title, listId), then replace formData.get as string with formDataString"
    status: completed
  - id: p2-formdata-card-modal-header
    content: "card-modal-header: colocated test covering submit → execute args, then replace formData.get as string with formDataString"
    status: completed
  - id: p2-formdata-card-modal-description
    content: "card-modal-description: colocated test covering submit → execute args, then replace formData.get as string with formDataString"
    status: completed
  - id: p3-msw-reorder
    content: "P3: Add MSW; CardModal Query+HTTP shell; FormPicker Unsplash SDK-seam gaps; list-container DropResult/reorder; 100% colocated peers; raise overall coverage vs P2 ledger"
    status: completed
  - id: p4-polish
    content: "P4: Broader role/a11y asserts; thin leftovers; raise overall coverage vs P3; then coverage.include/CI thresholds; confirm no remaining formData.get as string in app UI"
    status: completed
  - id: list-container-handle-drag-end
    content: "Follow-up: simplify list-container handleDragEnd (dispatcher, clone-before-mutate, drop narrating comments). Keep DropResult suite green. P3 only DRY rearrange/updateOrder."
    status: completed
  - id: lists-container-rename
    content: "Shipped in PR #11 — lists-container/ + domain names. SoT: docs/conventions.md (folder colocation, *Container vs *Wrapper, UI data ban)."
    status: completed
isProject: false
---

# Vitest test backlog

Harness: [`vitest.config.mts`](../../vitest.config.mts), SoT [`docs/testing.md`](../../docs/testing.md). Vitest owns unit/component; Playwright later owns E2E. CI: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (was `vitest.yml`).

**Conventions:** colocated `*.test.ts(x)` next to source; `import { describe, expect, test, vi } from "vitest"`; `vi.*` only; `test.for` for table-driven cases; no real network/DB.

**Per-P plans:** P0 was compressed into this backlog only. P1+ execution plans: [`vitest_p1_mocked_unit_c7e24825.plan.md`](vitest_p1_mocked_unit_c7e24825.plan.md); [`vitest_p2_components_85befd87.plan.md`](vitest_p2_components_85befd87.plan.md); [`vitest_p3_msw_reorder.plan.md`](vitest_p3_msw_reorder.plan.md); [`vitest_p4_polish.plan.md`](vitest_p4_polish.plan.md).

## Freeze & coverage ratchet (historical — backlog finished)

SoT going forward: [`docs/testing.md`](../../docs/testing.md) (**Colocated 100% + coverage thresholds**). The feature freeze ended with P4.

| Rule                     | Meaning                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No new features**      | No new product capability until P4 is finished. Tests, docs/plans, TDD-forced fixes, backlog-listed cleanups, and **store/Query hygiene** paired with colocated suites ([`docs/testing.md`](../../docs/testing.md)) only. |
| **New test → 100% peer** | Each new/expanded `*.test.*` must drive its colocated source peer(s) to **100%** stmts / branch / funcs / lines (`pnpm test:coverage:paths …`).                                                                           |
| **End of P → overall ↑** | Closing a P requires `pnpm test:coverage` **All files** statements **strictly above** the previous closed P in the ledger (other metrics must not regress). Do not shrink `coverage.include` to fake the rise.            |

### Coverage ledger

Record from `pnpm test:coverage` summary **after each P is merged** (same `vitest.config.mts` include) — not while the PR is still in review. Until then, current numbers live only in a fresh local/CI run under gitignored `coverage/` ([`docs/testing.md`](../../docs/testing.md)).

| Closed P | Date       | Stmts % | Branch % | Funcs % | Lines % | Notes                                                                                                                  |
| -------- | ---------- | ------- | -------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| P0       |            |         |          |         |         | Not captured at merge; P1 is the ratchet baseline for P2                                                               |
| P1       | 2026-08-07 | 27.27   | 23.07    | 37.00   | 27.06   | After [PR #7](https://github.com/manhcuongdtbk/taskify/pull/7) merge — `pnpm test:coverage` All files                  |
| P2       | 2026-08-10 | 64.12   | 49.63    | 84.49   | 63.87   | After [PR #8](https://github.com/manhcuongdtbk/taskify/pull/8) merge — `pnpm test:coverage` All files                  |
| P3       | 2026-08-14 | 69.91   | 57.92    | 88.69   | 69.2    | After [PR #9](https://github.com/manhcuongdtbk/taskify/pull/9) merge — `pnpm test:coverage` All files                  |
| P4       |            |         |          |         |         | Fill after merge. Pre-exclude All-files: 73.66 / 62.89 / 91.09 / 72.64 (beat P3). Then include polish + 99% thresholds |

---

## P0 — Done: pure unit (`*.test.ts`) + related hardening (PR #5)

Shipped on `test/vitest-p0-pure-unit` → [PR #5](https://github.com/manhcuongdtbk/taskify/pull/5). Colocated suites and supporting changes cover:

| Target                                                             | Assert / change                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`lib/generate-log-message.ts`](../../lib/generate-log-message.ts) | CREATE / UPDATE / DELETE / default strings for each `ACTION`                                             |
| [`lib/paths.ts`](../../lib/paths.ts)                               | Route builders return expected path strings                                                              |
| [`lib/utils.ts`](../../lib/utils.ts)                               | `cn` merge/dedupe; `absoluteUrl`; `cssUrl` quotes/escapes for CSS `url()`                                |
| [`constants/pricing-plans.ts`](../../constants/pricing-plans.ts)   | `hasUnlimitedBoards`, `formatBoardLimit` for Free vs Pro                                                 |
| [`lib/stripe.ts`](../../lib/stripe.ts) helpers only                | `stripeTimestampToDate`, `toStripeUnitAmount`, `toStripeCurrency` (Stripe client mocked on import)       |
| All 14 [`actions/*/schema.ts`](../../actions/)                     | `.safeParse` happy path + required/min-length failures via default issue-message helpers                 |
| [`lib/create-safe-action.ts`](../../lib/create-safe-action.ts)     | Unit suite: validation mapping, friendly copy, handler pass-through (shipped early; was listed under P1) |
| [`lib/testing/zod/`](../../lib/testing/zod/)                       | `safeParseFieldErrors`, `default-issue-messages` (`invalidType*` = `received undefined` only)            |

Also in this PR (not separate Vitest phases): shared `ActionState` / `FieldErrors` typing, nested `CreateBoardSchema.image`, https-only image URLs, board backgrounds painted via `cssUrl`, Vitest docs/conventions updates. Separate PR after P0: [`eslint-plugin-zod`](https://github.com/marcalexiei/eslint-plugin-zod) stock `recommended` (`eslint.config.mjs`) — [`docs/testing.md`](../../docs/testing.md) · [`docs/conventions.md`](../../docs/conventions.md).

---

## P1 — Done: unit with mocks + client state

Shipped on `test/vitest-p1-mocked-unit` → [PR #7](https://github.com/manhcuongdtbk/taskify/pull/7). Execution plan (look-back): [`vitest_p1_mocked_unit_c7e24825.plan.md`](vitest_p1_mocked_unit_c7e24825.plan.md). Colocated suites:

| Target                                                                                                                   | Assert / change                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [`lib/tanstack-query/fetcher.ts`](../../lib/tanstack-query/fetcher.ts) (was `lib/fetcher.ts`)                            | Stub `fetch`: ok → JSON body; `!ok` throws with status + statusText                                         |
| [`lib/env.ts`](../../lib/env.ts)                                                                                         | `stubEnv` + `resetModules`: development / production / test NODE_ENV flags                                  |
| [`stores/use-pro-modal-store.ts`](../../stores/use-pro-modal-store.ts)                                                   | `getState()` open / close                                                                                   |
| [`stores/use-mobile-sidebar-store.ts`](../../stores/use-mobile-sidebar-store.ts)                                         | same                                                                                                        |
| [`stores/use-card-modal-store.ts`](../../stores/use-card-modal-store.ts)                                                 | open sets id; `selectCardModalIsOpen` = `!!id` (empty string closed); close clears; second open replaces id |
| [`hooks/use-action.ts`](../../hooks/use-action.ts)                                                                       | `renderHook` suite as `.test.ts` (same extension as source for `coverage:paths`); success / errors / falsy  |
| [`lib/create-audit-log.ts`](../../lib/create-audit-log.ts)                                                               | Clerk + prisma `vi.mock` factories; suite-wide `console.log` spy; write / missing auth / create reject      |
| [`lib/tanstack-query/resources/card/index.ts`](../../lib/tanstack-query/resources/card/index.ts) (was `lib/api/card.ts`) | `byId` + leaf keys; `queryFn` URLs; detail `CardWithList \| null`; `findAll` scope tests                    |

Also in this PR (store/Query hygiene under freeze — [`docs/testing.md`](../../docs/testing.md)): move card Query factories to `lib/api` with `queryOptions`; `byId` invalidation (one call scopes detail + logs); derive open from **truthy** `id` via `selectCardModalIsOpen` (+ ESLint `select*`); card-modal consumers rewired; expect-order polish on `create-safe-action` tests. Root fix for 200-null card detail: shipped post-P4 (card 404 + route handler → `lib/tanstack-query/`).

Still deferred: `unsplash` / `prisma` singleton; no `vitest-mock-extended`. (`subscription` / `organization-limit` now have mocked Clerk+Prisma suites; `organization-limit` moved to `lib/board-limits/` post-P4.)

---

## P2 — Done: component static + interactive

Shipped on `test/vitest-p2-components` → [PR #8](https://github.com/manhcuongdtbk/taskify/pull/8). Execution plan: [`vitest_p2_components_85befd87.plan.md`](vitest_p2_components_85befd87.plan.md). First `*.test.tsx` house style + RTL `cleanup` in [`vitest.setup.ts`](../../vitest.setup.ts). Highlights:

- Form primitives; FormPicker a11y (button tiles, attribution `<a>` sibling); FormPopover controlled title
- ProModal / SubscriptionButton / BoardOptions / card-modal actions+activity / MobileSidebar
- FormData cleanup via shared [`lib/form-data.ts`](../../lib/form-data.ts) `formDataString` (no remaining `formData.get(…) as string` in app UI)
- `test:coverage:paths` escapes `[]`/`()` in path globs (Next `[boardId]` routes)
- Same PR follow-ups: `SkeletonStatus` + section vs item compounds (ESLint); Vitest `mockReset` / `unstubGlobals` / `unstubEnvs`; board title confirmed local mirror + docs; FormPicker untitled-tile labels; `renderWithQuery`; sidebar storage keys; `useIsClient`

---

## P3 — Done: MSW + CardModal Query shell + reorder

Shipped on `test/vitest-p3-msw-reorder` → [PR #9](https://github.com/manhcuongdtbk/taskify/pull/9). Execution plan: [`vitest_p3_msw_reorder.plan.md`](vitest_p3_msw_reorder.plan.md). Highlights:

- First MSW harness under [`lib/testing/msw/`](../../lib/testing/msw/) (`handlers/` by resource, not top-level `mocks/`); `pendingForever` / `stillPending`; lifecycle in [`vitest.setup.ts`](../../vitest.setup.ts) (`listen` / `resetHandlers` / `close`, `onUnhandledRequest: "error"`)
- [`CardModal`](../../components/modals/card-modal/index.tsx) shell suite with MSW `/api/cards/:id` + `/audit-logs`; stubbed children; skeleton vs loaded gates (incl. 200-null + unauthorized)
- FormPicker keeps `vi.mock("@/lib/unsplash")` SDK seam (not BFF HTTP); loading status + error-payload + stale-reject coverage
- [`lists-container`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/lists-container/index.tsx>) synthetic `DropResult` via mocked `@hello-pangea/dnd` (no pointer DnD); `rearrange` + `updateOrder`; `lists` state; empty/missing card array no-ops
- Fishery typed fixtures under [`lib/testing/factories/`](../../lib/testing/factories/) (`board`, `list`, `card`, `audit-log`); copy association cards before stamping `listId`; vs prisma-fabbrica in [`docs/testing.md`](../../docs/testing.md)
- Prisma `query-options` + `*GetPayload` under [`lib/prisma/`](../../lib/prisma/) (not handwritten `Card & { list }`)
- date-fns `constructNow` for shared current instants (no parallel datetime libs)
- Audit-log vocabulary (`generateAuditLogMessage`; API `.../audit-logs`) — [`docs/vocabulary.md`](../../docs/vocabulary.md)
- ESLint flat `no-restricted-syntax` **replaces** (Fishery `*.test.*` block had dropped the other test-file bans — [`docs/testing.md`](../../docs/testing.md))

**Follow-up after P3 (shipped, `test/list-container-handle-drag-end`):** `handleDragEnd` dispatcher (list vs card), clone-before-mutate, persist leftover source cards on cross-list moves, skip rearrange when `from` is out of range, do not mutate list/card props. P3 itself only DRY’d `rearrange` / `updateOrder`.

**Follow-up (shipped, [PR #11](https://github.com/manhcuongdtbk/taskify/pull/11)):** `ListContainer` → `ListsContainer` (`lists-container/`), domain names instead of UI `data`, folder colocation like `card-modal/`. SoT: [`docs/conventions.md`](../../docs/conventions.md). Historical P3 plans may still say `list-container`.

---

## P4 — Done: polish

Shipped on `test/vitest-p4-polish`. Execution plan: [`vitest_p4_polish.plan.md`](vitest_p4_polish.plan.md). Highlights:

- Leftover suites: SkeletonStatus, ActivityItem, Logo, Hint, `createStore` (peer 100%)
- Named roles + TDD `aria-label` on icon-only List/Board/Mobile menu and close controls
- CardItem keyboard Enter/Space (same class as FormPicker); click still opens the card modal
- ESLint `formData.get(…) as string` gate; no remaining casts in app UI
- Pre-exclude All-files stmts **73.66%** (beat P3 69.91%); then exclude ungated files; `coverage.thresholds` 99%; CI (now [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml))
- Feature freeze dropped in [`docs/testing.md`](../../docs/testing.md)

## Post-backlog work (same branch, after P4)

After the backlog freeze dropped, product fixes and hardening continued on `test/vitest-p4-polish`:

- **Card 404:** route handler returns 404; card modal shows errors; audit-log reads skipped when card missing
- **Query:** retry 408/429; `lib/fetcher.ts` → `lib/tanstack-query/fetcher.ts`; `lib/api/card/` → `lib/tanstack-query/resources/card/`; `QueryProvider` test + React Query Devtools
- **Board-limits:** `lib/organization-limit.ts` → `lib/board-limits/organization-limit.ts`; atomic `SELECT FOR UPDATE` cap; `withOrganizationLimitLock`; Free slot reserve/release in create/delete transactions; `create-board-limit-copy` helper
- **Action handlers:** org-scoped board/list/card writes; interactive transactions for create/copy list+card and card order; `stripe-redirect` typed URL + org-pinned tests
- **Card modal:** remount description, actions, activity, title on card switch; refetch failure test
- **`actions/**/index.ts` coverage exclude dropped** — handlers now in the bucket
- **CI renamed** `vitest.yml` → `ci.yml`

## Out of this backlog

- E2E / visual → Playwright (not installed); Browser Mode only on decision-record triggers; Storybook = catalog later
- `unsplash` / `prisma` singleton; Unsplash Query factory
