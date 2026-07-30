# Prisma

Learning reference for **Prisma ORM** as used in this app (Postgres + Next.js).

| | |
| - | - |
| **Owner / SoT** | This file — schema/Client/migrations patterns and Prisma TODOs (not App Router fetch/mutate — that’s [`data.md`](./data.md)) |
| **Open when** | Changing schema, Client setup, migrations, or org-scoped query patterns |

Prefer [Prisma docs](https://www.prisma.io/docs) for the version in `package.json`. Repo skills under `.claude/skills/prisma-*` / `.agents/skills/prisma-*` help with CLI/Client. Index: [`README.md`](./README.md).

**Page shape:** Already following → TODO → Out of scope.

## Already following (keep as examples)

- **Schema + migrations** under `prisma/` (`schema.prisma`, `migrations/`)
- **Generated Client** output to `app/generated/prisma` (see `generator` in the schema) — import via `@/lib/prisma` or generated paths as needed
- **Next.js singleton Client** in `lib/prisma.ts` with `@prisma/adapter-pg` and `DATABASE_URL` ([Prisma + Next.js](https://www.prisma.io/docs/guides/frameworks/nextjs))
- **`prisma.config.ts`** for schema/migrations/datasource URL wiring
- **`postinstall`: `prisma generate`** so Client stays in sync after install
- **Domain models** for boards/lists/cards, audit logs, organization limits, and Stripe subscription mirror (`OrganizationSubscription`)
- **Organization scoping** — queries/mutations typically filter by Clerk `orgId` (tenant id), not a Prisma multi-tenant plugin
- **Cascade deletes** on list/card relations where the schema defines them

## TODO — follow Prisma / data-layer recommendations more closely

Check items off when the app (and this doc) match current Prisma guidance. Prefer official patterns over new repo-only rules.

- [ ] **Audit Prisma import paths** — resolve `// TODO: fix all prisma imports` in `lib/generate-log-message.ts` and standardize on Client / enums imports from the generated output
- [ ] **Consistent `orgId` (and ownership) filters** on every board/list/card mutation and sensitive read — treat missing tenant filters as a security bug ([Next.js data security](https://nextjs.org/docs/app/guides/data-security) applies at the action layer)
- [ ] **Document migration workflow** for contributors (`prisma migrate` / `db push` policy for local vs prod) using current Prisma CLI docs — keep one short “how we run migrations” note here when decided
- [ ] **Review indexes** for hot paths (`orgId`, `boardId`, order columns, Stripe id lookups) against real query patterns
- [ ] **Error handling** — map Prisma errors (e.g. unique violations on `OrganizationSubscription.orgId`) to safe action/`{ error }` responses where users can hit them (aligns with [`nextjs.md`](./nextjs.md) expected-error TODO)

When closing a TODO, update this list; add a one-line note under **Already following** if it teaches a lasting pattern.

## Out of scope for now (not TODOs)

- Prisma Accelerate / Pulse / full edge Client setups unless we adopt them
- Switching database providers
- Parallel ORMs alongside Prisma
