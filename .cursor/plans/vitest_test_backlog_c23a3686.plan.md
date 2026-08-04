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
    content: "TODO later — P1: create-safe-action, fetcher, env, 3 Zustand stores, use-action hook"
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
- Skip Clerk/Prisma singletons (`subscription`, `organization-limit`, `create-audit-log`, `prisma`, `unsplash`) until a mocked DAL or Playwright

### P2 — Component static + interactive

- Form primitives; pro-modal / mobile-sidebar; board forms/options; form-popover; subscription-button; card-modal pieces (mocked actions)

### P3 — Component + HTTP (MSW) + reorder

- Add MSW; card-modal Query; form-picker Unsplash mock; list-container `DropResult` logic (no pointer DnD)

### P4 — Polish

- Role/a11y asserts in component suites; thin leftovers; coverage/CI tighten

### Forever not Vitest (other tools)

- E2E / visual → Playwright; Browser Mode only on decision-record triggers; Storybook = catalog later
