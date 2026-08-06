---
name: Vitest test backlog
overview: "P0 done (pure Vitest unit suites for lib helpers, pricing helpers, Stripe money helpers, and all 14 action Zod schemas). Remaining backlog: P1–P4 (mocked I/O, components incl. FormPicker a11y + FormPopover controlled-title TDD + FormData.get as-string cleanup, MSW, polish)."
todos:
  - id: branch-from-main
    content: Create a new branch from up-to-date main for P0 Vitest suites
    status: completed
  - id: p0-pure-unit
    content: "P0: Colocated unit tests for generate-log-message, paths, utils, pricing helpers, stripe helpers, all 14 action schemas; pnpm test:run green"
    status: completed
  - id: review-then-pr
    content: Self-review the P0 diff, then push and open PR to main
    status: completed
  - id: p1-mocked-unit
    content: "TODO later — P1: create-safe-action, fetcher, env, 3 Zustand stores, use-action; first Prisma Client mock via Vitest vi.mock factory or lib/__mocks__/prisma (no vitest-mock-extended by default) for create-audit-log"
    status: pending
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

## P0 — Done: pure unit (`*.test.ts`)

Shipped on `test/vitest-p0-pure-unit` (PR to `main`). Colocated suites cover:

| Target                                                             | Assert                                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [`lib/generate-log-message.ts`](../../lib/generate-log-message.ts) | CREATE / UPDATE / DELETE / default strings for each `ACTION`                                       |
| [`lib/paths.ts`](../../lib/paths.ts)                               | Route builders return expected path strings                                                        |
| [`lib/utils.ts`](../../lib/utils.ts)                               | `cn` merge/dedupe; `absoluteUrl` with stubbed `NEXT_PUBLIC_APP_URL`                                |
| [`constants/pricing-plans.ts`](../../constants/pricing-plans.ts)   | `hasUnlimitedBoards`, `formatBoardLimit` for Free vs Pro                                           |
| [`lib/stripe.ts`](../../lib/stripe.ts) helpers only                | `stripeTimestampToDate`, `toStripeUnitAmount`, `toStripeCurrency` (Stripe client mocked on import) |
| All 14 [`actions/*/schema.ts`](../../actions/)                     | `.safeParse` happy path + required/min-length failures                                             |

---

## TODO later

### P1 — Unit with mocks + client state

- [`lib/create-safe-action.ts`](../../lib/create-safe-action.ts), [`lib/fetcher.ts`](../../lib/fetcher.ts), [`lib/env.ts`](../../lib/env.ts)
- Three Zustand stores; [`hooks/use-action.ts`](../../hooks/use-action.ts)
- **Prisma Client mock (first):** [`lib/create-audit-log.ts`](../../lib/create-audit-log.ts) via Vitest `vi.mock` **factory** or colocated `lib/__mocks__/prisma.ts` stubbing only methods under test — see [`docs/testing.md`](../../docs/testing.md) (Prisma-related). Do **not** add `vitest-mock-extended` unless a narrow stub becomes painful. Types-only helpers (e.g. `generate-log-message`) stay without Client mocks. Blog series index: [Testing with Prisma](https://www.prisma.io/blog/series/testing-with-prisma) (parts 1–2 when implementing; 3–5 later).
- Still skip or defer heavy Clerk+Prisma paths (`subscription`, `organization-limit`) until that pattern is proven; `unsplash` / `prisma` singleton itself are not unit targets

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
