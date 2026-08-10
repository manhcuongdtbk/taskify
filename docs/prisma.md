# Prisma

Learning reference for **Prisma ORM** as used in this app (Postgres + Next.js).

|                 |                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — schema/Client/migrations patterns and Prisma TODOs (not App Router fetch/mutate — that’s [`data.md`](./data.md)) |
| **Open when**   | Changing schema, Client setup, migrations, or org-scoped query patterns                                                      |

Prefer [Prisma docs](https://www.prisma.io/docs) for the versions in `package.json` (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`) — [`conventions.md` → Match installed](./conventions.md#match-installed-official-docs). This file is **our** schema / Client / migration patterns — not a Prisma docs mirror. Repo skills under `.claude/skills/prisma-*` / `.agents/skills/prisma-*` help with CLI/Client. Index: [`README.md`](./README.md).

**Testing code that touches Prisma** (types-only vs mocked Client vs real DB vs Playwright; fixture vs mock; no root `"type": "module"` for blog parity): [`testing.md`](./testing.md) — section **Prisma-related code (what to test how)**. Do not duplicate that decision tree here.

**Page shape:** Already following → TODO → Out of scope.

## Already following (keep as examples)

- **Schema + migrations** under `prisma/` (`schema.prisma`, `migrations/`)
- **Generated Client** output to `app/generated/prisma` (see `generator` in the schema) — import via `@/lib/prisma` or generated paths as needed
- **Next.js singleton Client** in `lib/prisma.ts` with `@prisma/adapter-pg` and `DATABASE_URL` ([Prisma + Next.js](https://www.prisma.io/docs/guides/frameworks/nextjs))
- **`prisma.config.ts`** for schema/migrations/datasource URL wiring
- **`postinstall`: `prisma generate`** so Client stays in sync after install
- **Schema format / validate on the lint contract** — editor uses the Prisma VS Code formatter; `pnpm lint:prisma` / `lint:prisma:fix` (`scripts/check-prisma-schema.ts`); staged `*.prisma` via lint-staged. Do **not** use Prettier on `.prisma`. SQL migrations are left unformatted. See [`conventions.md`](./conventions.md#lint--format-one-contract).
- **Domain models** for boards/lists/cards, audit logs, organization limits, and Stripe subscription mirror (`OrganizationSubscription`)
- **Organization scoping** — queries/mutations typically filter by Clerk `orgId` (tenant id), not a Prisma multi-tenant plugin
- **Cascade deletes** on list/card relations where the schema defines them
- **Testing guidance** for Prisma-touched code lives in [`testing.md`](./testing.md) (types-only example: `lib/generate-log-message`; Client-mock when added — not Jest)

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
