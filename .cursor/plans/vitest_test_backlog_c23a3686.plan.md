---
name: Vitest test backlog
overview: "P0 done (pure Vitest unit suites for lib helpers, pricing helpers, Stripe money helpers, and all 14 action Zod schemas). Remaining backlog: P1–P4 (mocked I/O, components, MSW, polish)."
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
    content: "TODO later — P2: Form primitives + pro/mobile modals + board forms/options + form-popover + subscription-button + card-modal pieces"
    status: pending
  - id: p3-msw-reorder
    content: "TODO later — P3: Add MSW; card-modal Query; form-picker Unsplash mock; list-container DropResult/reorder"
    status: pending
  - id: p4-polish
    content: "TODO later — P4: Role/a11y asserts; thin leftovers; coverage/CI tighten"
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

### P3 — Component + HTTP (MSW) + reorder

- Add MSW; card-modal Query; form-picker Unsplash mock; list-container `DropResult` logic (no pointer DnD)

### P4 — Polish

- Role/a11y asserts in component suites; thin leftovers; coverage/CI tighten

### Follow-up (separate PR after P0)

- [`eslint-plugin-zod`](https://github.com/marcalexiei/eslint-plugin-zod) — harden Zod authoring (Zod 4–compatible rules only); tracked in [`docs/testing.md`](../../docs/testing.md) TODO. Not part of the Vitest P0 PR.

### Forever not Vitest (other tools)

- E2E / visual → Playwright; Browser Mode only on decision-record triggers; Storybook = catalog later
