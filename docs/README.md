# Docs

Entrypoint for project documentation. **Add new docs here** when you create them — other pages should link to this index (or to one closely related topic), not re-list the whole catalog.

Prefer official docs for the versions in `package.json`. This repo is a **learning reference** today and a **foundation for a real product** — docs map what we ship, how we choose patterns, and learning TODOs. Decision order: [`conventions.md`](./conventions.md).

## Start here

| Doc | What it’s for |
| --- | ------------- |
| [`features.md`](./features.md) | What the app does (features + where to look) |
| [`conventions.md`](./conventions.md) | How we choose patterns (priority ladder; where each rung is documented) |
| [`project-structure.md`](./project-structure.md) | Folder layout / App Router organization in this repo |

## Stack learning guides

Same shape where possible: **already following** + **TODOs** to stay a faithful reference.

| Doc | Stack |
| --- | ----- |
| [`nextjs.md`](./nextjs.md) | Next.js App Router |
| [`clerk.md`](./clerk.md) | Clerk auth & Organizations |
| [`prisma.md`](./prisma.md) | Prisma / Postgres data layer |
| [`stripe.md`](./stripe.md) | Billing (Stripe) for the **Pro** plan — deep dive + backlog |

## Maintenance

- **Catalog:** update this file when adding/renaming/removing a doc.
- **Cross-links:** from a topic page, link the [index](./README.md) plus at most one neighbor you truly depend on (e.g. Clerk → Stripe only where `orgId` billing coupling matters). Avoid copying the full table into every file.
- **Code comments / Cursor rules** that point at a specific doc (especially `stripe.md`) are fine — those guide implementers in-context; they are not a second catalog.
- **Don’t invent** empty stack docs; wait until there are concrete patterns or TODOs ([`conventions.md`](./conventions.md)).
