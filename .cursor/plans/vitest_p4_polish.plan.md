---
name: Vitest P4 polish
overview: "Done — P4 polish shipped on test/vitest-p4-polish. Named-role/a11y, leftover suites, ratchet vs P3, include/thresholds/CI, freeze dropped."
todos:
  - id: branch-p4
    content: Create test/vitest-p4-polish from up-to-date main; write this plan under .cursor/plans/
    status: completed
  - id: wave1-leftovers
    content: "Colocated 100% suites: skeleton-status, activity-item, logo, hint, create-store"
    status: completed
  - id: wave2-a11y
    content: Named-role queries; TDD aria-label on icon-only menu/close; CardItem keyboard TDD + fix
    status: completed
  - id: wave3-formdata-gate
    content: Confirm no formData.get as string in UI; ESLint restricted-syntax gate
    status: completed
  - id: wave4-ratchet
    content: pnpm test:run green; All-files stmts > 69.91% on current include
    status: completed
  - id: wave5-thresholds-ci
    content: Tighten coverage.include/exclude; Vitest thresholds; GitHub Actions vitest workflow
    status: completed
  - id: wave6-docs-pr
    content: Drop freeze in docs/testing.md; mark backlog P4 done; open PR
    status: completed
isProject: false
---

# Vitest P4 — polish (last backlog slice)

**Cadence:** `test/vitest-p4-polish` from `main`. Parent: [`vitest_test_backlog_c23a3686.plan.md`](vitest_test_backlog_c23a3686.plan.md).

**Ratchet (same include as P3, before exclude polish):** All-files **73.66 / 62.89 / 91.09 / 72.64** (P3 was 69.91 / 57.92 / 88.69 / 69.2). Then exclude ungated files; `coverage.thresholds` 99%; CI [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

## Shipped

- Leftover suites: SkeletonStatus, ActivityItem, Logo, Hint, createStore
- Named roles + TDD aria-label on icon-only menu/close; CardItem keyboard
- ESLint `formData.get as string` gate
- Freeze dropped in [`docs/testing.md`](../../docs/testing.md)

## Shipped after P4 (same branch, post-backlog)

- **Card 404:** route handler returns 404 for missing cards; card modal shows errors instead of skeletons; audit-log reads skipped when card is missing (`80d14c5`..`ae6ccfd`)
- **Query hardening:** retry 408/429, `lib/tanstack-query/` (moved from `lib/api/` and `lib/fetcher.ts`), `QueryProvider` test, React Query Devtools
- **Board-limits:** collocated under `lib/board-limits/` (was `lib/organization-limit.ts`); atomic `SELECT FOR UPDATE` cap; `withOrganizationLimitLock`; Free slot reserve/release in same transaction as create/delete; new `create-board-limit-copy` helper + tests
- **Action handler hardening:** org-scoped board/list/card writes; interactive transactions for create/copy list+card and card order; `stripe-redirect` typed URL + pinned org tests
- **Card modal remount:** description, actions, activity, and title reset when a different card is opened
- **`actions/**/index.ts` exclude dropped** from `vitest.config.mts` — action handlers are now in the coverage bucket (most have Vitest suites or are org-scoped wrappers)
- **CI renamed** `vitest.yml` → `ci.yml`

## Still later

Prisma/Unsplash singletons, Unsplash Query factory, Playwright / Browser Mode / Storybook. (`lib/subscription.ts` / `lib/board-limits/organization-limit.ts` are in the coverage bucket with mocked Clerk+Prisma suites — not exclude-list leftovers.)
