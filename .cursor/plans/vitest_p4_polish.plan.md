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

**Ratchet (same include as P3, before exclude polish):** All-files **73.66 / 62.89 / 91.09 / 72.64** (P3 was 69.91 / 57.92 / 88.69 / 69.2). Then exclude ungated files; `coverage.thresholds` 99%; CI [`.github/workflows/vitest.yml`](../../.github/workflows/vitest.yml).

## Shipped

- Leftover suites: SkeletonStatus, ActivityItem, Logo, Hint, createStore
- Named roles + TDD aria-label on icon-only menu/close; CardItem keyboard
- ESLint `formData.get as string` gate
- Freeze dropped in [`docs/testing.md`](../../docs/testing.md)

## Still later (not this backlog)

Prisma/Unsplash singletons, `actions/*/index.ts`, card 404, Unsplash Query factory, Playwright / Browser Mode / Storybook. (`lib/subscription.ts` / `lib/organization-limit.ts` are in the coverage bucket with mocked Clerk+Prisma suites — not exclude-list leftovers.)
