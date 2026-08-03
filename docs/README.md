# Docs

Entrypoint for project documentation. **Add new docs here** when you create them — other pages should link to this index (or to one closely related topic), not re-list the whole catalog.

**For agents:** start here, then open the matching concern doc. Do not invent a parallel stack or a second catalog. Point at **files**, not section titles. Cursor always-on rule: `.cursor/rules/docs.mdc`.

Prefer official docs for the versions in `package.json`. This repo is a **learning reference** today and a **foundation for a real product** — docs map what we ship, how we choose patterns, and learning TODOs. Engineering decisions: [`conventions.md`](./conventions.md) (incl. **[one tool per job](./conventions.md#one-tool-per-job)**). Domain / cert decisions: [`product.md`](./product.md). Shared words (**common practice**, **best practice**, **one tool per job**, …): [`vocabulary.md`](./vocabulary.md).

**Concern over vendor:** name durable docs for the **concern** (`data`, `billing`, `authentication-and-authorization`). Current libraries/providers (TanStack Query, Stripe, Clerk, …) live _inside_ those pages and may be swapped later.

## Start here

Orientation for the product and how we choose patterns. When changing how something works, open the matching concern under [Stack learning guides](#stack-learning-guides).

| Doc                                              | What it’s for                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [`vocabulary.md`](./vocabulary.md)               | Definitions: common practice vs best practice, recommendation, priority list, …   |
| [`product.md`](./product.md)                     | Who it’s for, vision, domain/cert priority list and terms                         |
| [`features.md`](./features.md)                   | What the app does today (features + where to look)                                |
| [`conventions.md`](./conventions.md)             | How we choose engineering patterns (priority list + **common practices catalog**) |
| [`project-structure.md`](./project-structure.md) | Folder layout / App Router organization (+ **common practice folder catalog**)    |

## Stack learning guides

Concern and framework maps (each listed once). Same shape where possible: **Owner / SoT** + **Open when** → **Already following** → **TODO** → **Out of scope** → deep detail.

| Doc                                                                            | Concern (implementation today)                                                   |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [`nextjs.md`](./nextjs.md)                                                     | Next.js App Router                                                               |
| [`data.md`](./data.md)                                                         | Fetching & mutating (App Router map; TanStack Query when/where; cache / DAL·DTO) |
| [`billing.md`](./billing.md)                                                   | Billing — **Stripe** today for the **Pro** plan; deep dive + backlog             |
| [`authentication-and-authorization.md`](./authentication-and-authorization.md) | Authentication & authorization — **Clerk** today; exit notes                     |
| [`prisma.md`](./prisma.md)                                                     | Prisma / Postgres data layer                                                     |
| [`client-ui-state.md`](./client-ui-state.md)                                   | Ephemeral client UI state — **Zustand** today (modals, sidebars, …)              |
| [`testing.md`](./testing.md)                                                   | Testing — **Vitest** (+ Testing Library) today; Playwright / MSW when needed     |

## Maintenance

- **Catalog:** update this file when adding/renaming/removing a doc.
- **Cross-links:** from a topic page, link the [index](./README.md) plus at most one neighbor you truly depend on (e.g. authentication ↔ billing only where `orgId` coupling matters). Avoid copying the full table into every file.
- **Code comments / Cursor rules** that point at a concern doc (e.g. `billing.md`) are fine — point at the **file**, not at another doc’s section titles (those drift). They are not a second catalog.
- **Don’t invent** empty stack docs; wait until there are concrete patterns or TODOs ([`conventions.md`](./conventions.md)).
- **Don’t name new concern docs after a vendor** (`stripe.md`, `clerk.md`, `tanstack-query.md`) unless the page is only SDK trivia — prefer the durable concern name.
