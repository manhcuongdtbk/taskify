# Docs

Entrypoint for project documentation. **Add new docs here** when you create them — other pages should link to this index (or to one closely related topic), not re-list the whole catalog.

Prefer official docs for the versions in `package.json`. This repo is a **learning reference** today and a **foundation for a real product** — docs map what we ship, how we choose patterns, and learning TODOs. Engineering decisions: [`conventions.md`](./conventions.md). Domain / cert decisions: [`product.md`](./product.md). Shared words (**common practice**, **best practice**, …): [`vocabulary.md`](./vocabulary.md).

**Concern over vendor:** name durable docs for the **concern** (`data`, `billing`, `authentication-and-authorization`). Current libraries/providers (TanStack Query, Stripe, Clerk, …) live *inside* those pages and may be swapped later.

## Start here

| Doc | What it’s for |
| --- | ------------- |
| [`vocabulary.md`](./vocabulary.md) | Definitions: common practice vs best practice, recommendation, priority list, … |
| [`product.md`](./product.md) | Who it’s for, vision, domain/cert priority list and terms |
| [`features.md`](./features.md) | What the app does today (features + where to look) |
| [`conventions.md`](./conventions.md) | How we choose engineering patterns (priority list + **common practices catalog**) |
| [`project-structure.md`](./project-structure.md) | Folder layout / App Router organization (+ **common practice folder catalog**) |
| [`data.md`](./data.md) | Fetching & mutating (App Router map; TanStack Query when/where; cache / DAL·DTO) |
| [`billing.md`](./billing.md) | Billing & pricing-plan gating (Stripe is the current **billing provider**) |
| [`authentication-and-authorization.md`](./authentication-and-authorization.md) | Authentication & authorization (Clerk is the current **authentication provider**) |

## Stack learning guides

Same shape where possible: **already following** + **TODOs** to stay a faithful reference.

| Doc | Concern (implementation today) |
| --- | ------------------------------ |
| [`nextjs.md`](./nextjs.md) | Next.js App Router |
| [`authentication-and-authorization.md`](./authentication-and-authorization.md) | Authentication & authorization — **Clerk** today; exit notes |
| [`prisma.md`](./prisma.md) | Prisma / Postgres data layer |
| [`billing.md`](./billing.md) | Billing — **Stripe** today for the **Pro** plan; deep dive + backlog |

## Maintenance

- **Catalog:** update this file when adding/renaming/removing a doc.
- **Cross-links:** from a topic page, link the [index](./README.md) plus at most one neighbor you truly depend on (e.g. authentication ↔ billing only where `orgId` coupling matters). Avoid copying the full table into every file.
- **Code comments / Cursor rules** that point at a specific doc (especially `billing.md`) are fine — those guide implementers in-context; they are not a second catalog.
- **Don’t invent** empty stack docs; wait until there are concrete patterns or TODOs ([`conventions.md`](./conventions.md)).
- **Don’t name new concern docs after a vendor** (`stripe.md`, `clerk.md`, `tanstack-query.md`) unless the page is only SDK trivia — prefer the durable concern name.
