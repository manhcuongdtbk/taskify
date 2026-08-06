---
name: Vitest test backlog
overview: "P0 (PR #5) + P1 done on test/vitest-p1-mocked-unit: fetcher, env, 3 Zustand stores, use-action, create-audit-log (Clerk + Prisma vi.mock factories). Remaining: P2–P4 (components incl. FormPicker a11y + FormPopover controlled-title TDD + FormData.get as-string cleanup, MSW, polish)."
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
    content: "TODO later — P2: Form primitives + pro/mobile modals + board forms/options + form-popover + form-picker (incl. a11y TDD) + subscription-button + card-modal pieces"
    status: pending
  - id: p2-form-picker-a11y
    content: "TODO later — FormPicker a11y: failing colocated test first (keyboard reach/activate → onSelect), then fix div+onClick; use defaultImages (no MSW). See docs/testing.md Fixing bugs with tests"
    status: pending
  - id: p2-form-popover-controlled-title
    content: "TODO later — FormPopover title: failing test first (value survives invalid submit), then make title controlled like selectedImage; drop FormData for title. See inline TODO in form-popover.tsx"
    status: pending
  - id: p2-formdata-board-title-form
    content: "TODO later — board-title-form: colocated test covering submit → execute args, then replace formData.get as string with typeof narrow (docs/data.md)"
    status: pending
  - id: p2-formdata-list-form
    content: "TODO later — list-form: colocated test covering submit → execute args, then replace formData.get as string with typeof narrow"
    status: pending
  - id: p2-formdata-list-header
    content: "TODO later — list-header: colocated test covering submit → execute args, then replace formData.get as string with typeof narrow"
    status: pending
  - id: p2-formdata-list-options
    content: "TODO later — list-options: colocated test covering both copy/delete submit handlers → execute args, then replace formData.get as string with typeof narrow"
    status: pending
  - id: p2-formdata-card-form
    content: "TODO later — card-form: colocated test covering submit → execute args (title, listId), then replace formData.get as string with typeof narrow"
    status: pending
  - id: p2-formdata-card-modal-header
    content: "TODO later — card-modal-header: colocated test covering submit → execute args, then replace formData.get as string with typeof narrow"
    status: pending
  - id: p2-formdata-card-modal-description
    content: "TODO later — card-modal-description: colocated test covering submit → execute args, then replace formData.get as string with typeof narrow"
    status: pending
  - id: p3-msw-reorder
    content: "TODO later — P3: Add MSW; card-modal Query; form-picker Unsplash fetch mock; list-container DropResult/reorder"
    status: pending
  - id: p4-polish
    content: "TODO later — P4: Broader role/a11y asserts (beyond FormPicker); thin leftovers; coverage/CI tighten; confirm no remaining formData.get as string in app UI"
    status: pending
isProject: false
---

# Vitest test backlog

Harness: [`vitest.config.mts`](../../vitest.config.mts), SoT [`docs/testing.md`](../../docs/testing.md). Vitest owns unit/component; Playwright later owns E2E.

**Conventions:** colocated `*.test.ts(x)` next to source; `import { describe, expect, test, vi } from "vitest"`; `vi.*` only; `test.for` for table-driven cases; no real network/DB.

---

## P0 — Done: pure unit (`*.test.ts`) + related hardening (PR #5)

Shipped on `test/vitest-p0-pure-unit` → [`PR #5`](https://github.com/manhcuongdtbk/taskify/pull/5). Colocated suites and supporting changes cover:

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

Also in this PR (not separate Vitest phases): shared `ActionState` / `FieldErrors` typing, nested `CreateBoard.image`, https-only image URLs, board backgrounds painted via `cssUrl`, Vitest docs/conventions updates.

---

## P1 — Done: unit with mocks + client state

Shipped on `test/vitest-p1-mocked-unit`. Colocated suites:

| Target                                                                           | Assert / change                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`lib/fetcher.ts`](../../lib/fetcher.ts)                                         | Stub `fetch`: ok → JSON body; `!ok` throws with status + statusText                              |
| [`lib/env.ts`](../../lib/env.ts)                                                 | `stubEnv` + `resetModules`: development / production / test NODE_ENV flags                       |
| [`stores/use-pro-modal-store.ts`](../../stores/use-pro-modal-store.ts)           | `getState()` open / close                                                                        |
| [`stores/use-mobile-sidebar-store.ts`](../../stores/use-mobile-sidebar-store.ts) | same                                                                                             |
| [`stores/use-card-modal-store.ts`](../../stores/use-card-modal-store.ts)         | open sets id; close clears; second open replaces id                                              |
| [`hooks/use-action.ts`](../../hooks/use-action.ts)                               | `renderHook`: success / serverError / field+form errors / falsy result; loading + callbacks      |
| [`lib/create-audit-log.ts`](../../lib/create-audit-log.ts)                       | Clerk + `@/lib/prisma` `vi.mock` factories: write row; missing auth; create reject → `{ error }` |

Still deferred: heavy Clerk+Prisma paths (`subscription`, `organization-limit`); `unsplash` / `prisma` singleton; no `vitest-mock-extended`.

---

## TODO later

### P2 — Component static + interactive

- Form primitives; pro-modal / mobile-sidebar; board forms/options; form-popover; subscription-button; card-modal pieces (mocked actions)
- **[`components/form/form-picker.tsx`](../../components/form/form-picker.tsx) a11y (do with TDD):** tiles are `div` + `onClick` only — not keyboard-reachable / activatable. Process per [`docs/testing.md`](../../docs/testing.md) _Fixing bugs with tests_:
  1. Add failing colocated `form-picker.test.tsx` (e.g. focus a tile, `Enter`/`Space` → `onSelect` called with the structured image).
  2. Confirm it fails on current markup.
  3. Fix implementation (accessible control without nesting the Unsplash attribution `<a>` inside a `<button>`).
  4. Keep the test as a regression guard.
  - Use `defaultImages` + mock/stub Unsplash fetch so this is **not** blocked on P3 MSW. `userEvent.setup()` before `render`.
- **[`components/form/form-popover.tsx`](../../components/form/form-popover.tsx) controlled title (do with TDD):** today `title` still comes from `FormData` (narrowed with `typeof`, not `as string`). Uncontrolled `FormInput` clears after an invalid submit (inline TODO). Process:
  1. Add failing colocated `form-popover.test.tsx` that submits an invalid payload and asserts the typed title is still in the input.
  2. Confirm it fails on current uncontrolled `defaultValue`.
  3. Hold `title` in `useState` like `selectedImage`; pass controlled value into `FormInput`; assemble `execute({ title, image })` without reading title from `FormData`.
  4. Keep the test as a regression guard. Mock `createBoard` / `useAction` as needed.

#### `FormData.get(…) as string` cleanup (after tests)

Policy: [`docs/data.md`](../../docs/data.md) — narrow (`typeof x === "string" ? x : ""`), do **not** cast. Repo copies of `as string` are legacy until each site below is covered. **Do not** mass-replace without colocated tests; “common in the repo” is not endorsement.

Per file (test submit → `execute` / action args, **then** replace casts):

| Todo id                              | File                                                                                                          | Fields still cast                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `p2-formdata-board-title-form`       | [`board-title-form.tsx`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/board-title-form.tsx>) | `title`                                  |
| `p2-formdata-list-form`              | [`list-form.tsx`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/list-form.tsx>)               | `title`, `boardId`                       |
| `p2-formdata-list-header`            | [`list-header.tsx`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/list-header.tsx>)           | `title`, `id`, `boardId`                 |
| `p2-formdata-list-options`           | [`list-options.tsx`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/list-options.tsx>)         | `id`, `boardId` (copy + delete handlers) |
| `p2-formdata-card-form`              | [`card-form.tsx`](<../../app/(platform)/(dashboard)/board/[boardId]/_components/card-form.tsx>)               | `title`, `listId`                        |
| `p2-formdata-card-modal-header`      | [`card-modal-header.tsx`](../../components/modals/card-modal/card-modal-header.tsx)                           | `title`                                  |
| `p2-formdata-card-modal-description` | [`card-modal-description.tsx`](../../components/modals/card-modal/card-modal-description.tsx)                 | `description`                            |

Already done (narrowed, no cast): [`form-popover.tsx`](../../components/form/form-popover.tsx) `title`. Out of scope here: non-`FormData` casts (Stripe webhook, route `params`, etc.).

### P3 — Component + HTTP (MSW) + reorder

- Add MSW; card-modal Query; form-picker **network** Unsplash mock (happy/error paths beyond `defaultImages`); list-container `DropResult` logic (no pointer DnD)

### P4 — Polish

- Broader role/a11y asserts in other component suites (FormPicker keyboard covered under P2); thin leftovers; coverage/CI tighten
- Confirm no remaining `formData.get(…) as string` under app UI / form components (ripgrep gate)

### Follow-up (separate PR after P0)

- [`eslint-plugin-zod`](https://github.com/marcalexiei/eslint-plugin-zod) — harden Zod authoring (Zod 4–compatible rules only); tracked in [`docs/testing.md`](../../docs/testing.md) TODO. Not part of the Vitest P0 PR.

### Forever not Vitest (other tools)

- E2E / visual → Playwright; Browser Mode only on decision-record triggers; Storybook = catalog later
