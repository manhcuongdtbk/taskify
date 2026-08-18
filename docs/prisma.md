# Prisma

Learning reference for **Prisma ORM** as used in this app (Postgres + Next.js).

|                 |                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — schema/Client/migrations patterns and Prisma TODOs (not App Router fetch/mutate — that’s [`data.md`](./data.md))                              |
| **Open when**   | Changing schema, Client setup, migrations, org-scoped queries, or **shared Prisma query args / GetPayload types** (`lib/prisma/query-options/<model>.ts`) |

Prefer [Prisma docs](https://www.prisma.io/docs) for the versions in `package.json` (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`) — [`conventions.md` → Match installed](./conventions.md#match-installed-official-docs). This file is **our** schema / Client / migration patterns — not a Prisma docs mirror. Repo skills under `.claude/skills/prisma-*` / `.agents/skills/prisma-*` help with CLI/Client. Index: [`README.md`](./README.md).

**Testing code that touches Prisma** (types-only vs mocked Client vs real DB vs Playwright; fixture vs mock; no root `"type": "module"` for blog parity): [`testing.md`](./testing.md) — section **Prisma-related code (what to test how)**. Do not duplicate that decision tree here.

**Page shape:** Already following → TODO → Out of scope.

## Already following (keep as examples)

- **Schema + migrations** under `prisma/` (`schema.prisma`, `migrations/`)
- **Generated Client** output to `app/generated/prisma` (see `generator` in the schema) — import the live Client via `@/lib/prisma/client`. Split generated entrypoints: `client.ts` is Node-only (`PrismaClient` + `node:*`); enum **values** for Zod / Client Components come from `enums.ts` (or `browser.ts` for types + enums). A value import from `client.ts` in a `"use client"` graph (e.g. `lib/tanstack-query/resources/` JSON schemas) pulls `@prisma/client/runtime` into the browser and Turbopack fails (`node:module`). Type-only imports from `client.ts` are erased and stay safe.
- **Next.js singleton Client** in `lib/prisma/client.ts` with `@prisma/adapter-pg` and `DATABASE_URL` ([Prisma + Next.js](https://www.prisma.io/docs/guides/frameworks/nextjs)) — no barrel `index.ts`; import the file you need (`@/lib/prisma/client` vs `@/lib/prisma/query-options/<model>`)
- **`prisma.config.ts`** for schema/migrations/datasource URL wiring
- **`postinstall`: `prisma generate`** so Client stays in sync after install
- **Schema format / validate on the lint contract** — editor uses the Prisma VS Code formatter; `pnpm lint:prisma` validates and format-checks a temp copy (does not write `schema.prisma`); `lint:prisma:fix` runs `prisma format`. Staged `*.prisma` via lint-staged. Do **not** use Prettier on `.prisma`. SQL migrations are left unformatted. See [`conventions.md`](./conventions.md#lint--format-one-contract).
- **Domain models** for boards/lists/cards, audit logs, organization limits, and Stripe subscription mirror (`OrganizationSubscription`)
- **Organization scoping** — queries/mutations typically filter by Clerk `orgId` (tenant id), not a Prisma multi-tenant plugin
- **Organization board-limit writes** — The stored `OrganizationLimit.count` tracks the **actual number of open boards** regardless of plan. Both Free and Pro creates/deletes lock the org’s limit row (`SELECT … FOR UPDATE`), `COUNT` that org’s `Board` rows, and write the live number (plus one on create; as-is after delete). That keeps the counter aligned when it had drifted (Pro creates used not to increment). [`prisma/migrations/20260818120000_backfill_organization_limit_count`](../prisma/migrations/20260818120000_backfill_organization_limit_count/migration.sql) backfills existing rows. **Free creates** refuse when `COUNT(boards) >= maxBoards` (`incrementAvailableCount`). **Pro creates** always write `COUNT + 1` (`incrementBoardCount`). **Deletes** write `COUNT` after the board row is gone (`decrementAvailableCount`) — no plan check needed. A failed insert/delete rolls the counter change back. Plan access uses [`isProOrganization`](../lib/subscription.ts) on that same `tx` (not a pre-transaction `checkSubscription()`). `incrementAvailableCount` / `decrementAvailableCount` / `incrementBoardCount` take `orgId` from the Action and the interactive-transaction client (`tx`) — no `auth()` and no default global Client, because `FOR UPDATE` is released at statement end outside a transaction. `Board.orgId` is indexed for that `COUNT`. The lock target is inserted with `createMany` `skipDuplicates` (`ON CONFLICT DO NOTHING`) so a unique collision cannot abort the interactive transaction. Official `P2002` handling (when a query must throw): `instanceof Prisma.PrismaClientKnownRequestError` and `code === "P2002"` — [Handling exceptions and errors](https://www.prisma.io/docs/orm/prisma-client/debugging-and-troubleshooting/handling-exceptions-and-errors) · [Error reference (`P2002`)](https://www.prisma.io/docs/orm/reference/error-reference#p2002); catch **outside** `$transaction`, or isolate the throwing query in a nested `$transaction` (savepoint, Prisma 7.5+). No repo `P*` helper until a second call site needs one ([`project-structure.md`](./project-structure.md) `lib/prisma/errors/`). The user-facing cap is [`lib/errors/free-board-limit.ts`](../lib/errors/free-board-limit.ts) (domain `Error`, not a Prisma `P*` code). [`lib/board-limits/organization-limit.ts`](../lib/board-limits/organization-limit.ts) · [`actions/create-board/index.ts`](../actions/create-board/index.ts) · [`actions/delete-board/index.ts`](../actions/delete-board/index.ts)
- **Cascade deletes** on list/card relations where the schema defines them
- **Testing guidance** for Prisma-touched code lives in [`testing.md`](./testing.md) (types-only example: `lib/generate-audit-log-message`; Client-mock when added — not Jest)
- **Shared include/select + `GetPayload`** — one module per Prisma model under [`lib/prisma/query-options/`](../lib/prisma/query-options/) (e.g. [`card.ts`](../lib/prisma/query-options/card.ts), [`list.ts`](../lib/prisma/query-options/list.ts)): export `*Args` (`satisfies Prisma.*DefaultArgs`) for every reused query shape; add `*GetPayload` only when callers need a named result type. **Shapes only** — not `find*` / `create*` / authz (those stay at Actions / Route Handlers / RSC until a server-only access/DAL helper is justified; never in `lib/tanstack-query/resources/`). Matches [Operating against partial structures](https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types). Queries spread the same args so types match the real payload (e.g. card detail’s `list` is `{ title }` only). Prefer this over `Awaited<ReturnType<typeof queryFn>>` when the shape is shared. Broader overview: [type safety](https://www.prisma.io/docs/orm/prisma-client/type-safety) — don’t use `Args`/`Result` for domain payload aliases. [Prisma type system](https://www.prisma.io/docs/orm/prisma-client/type-safety/prisma-type-system) is schema scalars / `@db.*`, not relation payloads.

### If you know another ORM (Rosetta)

| Concept                             | This repo                                                                                                                                                                                       | Familiar elsewhere                                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Table / model definition            | `prisma/schema.prisma` → `model Card`                                                                                                                                                           | TypeORM `@Entity`, Drizzle `pgTable`, Rails/Django/Eloquent model                                                                      |
| Generated row type                  | `Card` from generated client                                                                                                                                                                    | Entity fields / inferred select type                                                                                                   |
| Persistence API                     | `prisma.card` → `@/lib/prisma/client`                                                                                                                                                           | TypeORM `getRepository(Card)`, Data Mapper gateway — **not** Active Record `card.save()`                                               |
| Shared include/select + result type | [`lib/prisma/query-options/card.ts`](../lib/prisma/query-options/card.ts) / [`list.ts`](../lib/prisma/query-options/list.ts) (`cardWithListTitleArgs`, `listWithCardsOrderedByOrderAscArgs`, …) | Named query options / Rails scopes — **not** a repository class                                                                        |
| Test row builders                   | [`lib/testing/factories/card.ts`](../lib/testing/factories/card.ts) (Fishery — default; response/`GetPayload` shapes)                                                                           | prisma-fabbrica only for real-DB Prisma suites — [`testing.md`](./testing.md#fishery-vs-prisma-fabbrica-do-not-replace-optional-later) |

Prisma Client is **Data Mapper–style** ([TypeORM: Active Record vs Data Mapper](https://typeorm.io/docs/guides/active-record-data-mapper/)): don’t add `CardRepository` or entity classes unless a real DAL layer is justified ([`data.md`](./data.md), [`project-structure.md`](./project-structure.md) `repositories/` When needed).

## Prisma generated type vocabulary (how to read it)

This repo uses Prisma’s generated types for two jobs:

1. **Define query options** (`select` / `include` / `omit`) so Prisma can fetch relations safely.
2. **Derive result types** from those query options so UI/actions/factories match the real payload.

### Row (scalar) model types

- **`Card` / `List`**: scalar fields for one row.
- Relations (like `Card.list`) are **not** on these types unless you explicitly `include` them in a query.

### Query options (what changes the shape)

Docs often call these **model query options**.
In codegen they show up as `*Select` / `*Include` / `*Omit` plus the convenience bundle `*DefaultArgs`.

- **`CardSelect` / `CardInclude` / `CardOmit`**: the `select` / `include` / `omit` objects.
- **`CardDefaultArgs`**: `{ select?, include?, omit? }` — enough to compute a result payload.

In this repo, modules like [`lib/prisma/query-options/card.ts`](../lib/prisma/query-options/card.ts) export values that are typed as `Prisma.CardDefaultArgs` using TypeScript `satisfies`.

### Operation args (where you put `where`, `orderBy`, etc.)

When you pass `findUnique` / `findMany` options, you’re using operation-specific arg types:

- `CardFindUniqueArgs` / `CardFindManyArgs` (and similarly for `List`, `Board`, …)
- Those include `where`, `orderBy`, `take`, `skip`, etc.

Typically: keep top-level `where` / `orderBy` / `take` at the call site. Put nested relation `orderBy` / `select` into a shared `*Args` only when that whole include tree is reused (it is part of the payload contract).

### Payload / result types (what you get back)

To derive the exact TypeScript shape a query returns for a given options object:

- **`CardGetPayload<S>`**
- where `S` is the shape of your `select` / `include` / `omit` options (usually the `typeof` your exported args value)

That’s why this repo pairs:

- `cardWithListTitleArgs` (typed as `Prisma.CardDefaultArgs`)
  with `CardWithListTitle = Prisma.CardGetPayload<typeof cardWithListTitleArgs>`
- `listWithCardsOrderedByOrderAscArgs` (typed as `Prisma.ListDefaultArgs`)
  with `ListWithCardsOrderedByOrderAsc = Prisma.ListGetPayload<typeof listWithCardsOrderedByOrderAscArgs>`

Keep `*Args` ↔ named `*GetPayload` **1:1** when callers need a result type. Export args without a payload alias when only the query options are reused.

### Naming shared query options (zero illusion → use-case)

| Contract size                                      | Strategy                                                     | Example                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1–2 salient constraints                            | Encode field / sort / direction in the name                  | `cardWithListTitle`, `listWithCardsOrderedByOrderAsc`                     |
| Many `select` fields, multi-key `orderBy`, or both | **Use-case / feature name** + JSDoc listing the real options | `boardColumnListsArgs` with comment for `order` asc then `createdAt` desc |

Never leave a vague name (`listWithCards`) while args quietly encode sort/select. `orderBy` does not change the TypeScript payload shape, but the **args name** (or JSDoc for fat contracts) still documents the query contract.

Prefer exact names while the contract is tiny; rename to the product/use-case when spelling every field would make the identifier unreadable. Don’t preemptively rename today’s small contracts.

### Composition (reuse nested relation options)

When the same nested relation options appear under more than one root (or you want a clear building block), export a small piece on the **relation’s** model file and spread it into the root `*Args`:

```ts
// lib/prisma/query-options/card.ts — Card findMany-style options reused inside includes
export const cardsOrderedByOrderAsc = {
  orderBy: { order: "asc" as const },
};

// lib/prisma/query-options/list.ts — root List query options compose the Card piece
export const listWithCardsOrderedByOrderAscArgs = {
  include: {
    cards: cardsOrderedByOrderAsc,
  },
} satisfies Prisma.ListDefaultArgs;
```

Composition is for **reuse and clarity**, not a second naming system. The **exported root** `*Args` still carries the full-tree name (or use-case name). Don’t extract a piece until a second call site (or a second root) needs it — one inline include is fine.

### Cross-cutting utilities (extensions / helpers)

Prisma also exposes general type utilities (usually for advanced type-safety and client extensions):

- **`Exact`** — strict assignability
- **`Args` / `Result` / `Payload`** — generic in/out helpers across model + operation

In this repo, we prefer `*GetPayload` for domain aliases because it stays closest to the query shape we actually use.

## TODO — follow Prisma / data-layer recommendations more closely

Check items off when the app (and this doc) match current Prisma guidance. Prefer official patterns over new repo-only rules.

- [ ] **Audit Prisma import paths** — resolve `// TODO: fix all prisma imports` in `lib/generate-audit-log-message.ts` and standardize on Client / enums imports from the generated output
- [ ] **Consistent `orgId` (and ownership) filters** on every board/list/card mutation and sensitive read — treat missing tenant filters as a security bug ([Next.js data security](https://nextjs.org/docs/app/guides/data-security) applies at the action layer)
- [ ] **Document migration workflow** for contributors (`prisma migrate` / `db push` policy for local vs prod) using current Prisma CLI docs — keep one short “how we run migrations” note here when decided
- [ ] **Review indexes** for remaining hot paths (`boardId`, order columns, Stripe id lookups, `AuditLog.orgId`) against real query patterns. `Board.orgId` is indexed for the board-limit `COUNT`.
- [ ] **Error handling** — map Prisma errors (e.g. unique violations on `OrganizationSubscription.orgId`) to safe action/`{ error }` responses where users can hit them (aligns with [`nextjs.md`](./nextjs.md) expected-error TODO)
- [ ] **Real-DB: Free board-slot lock + `COUNT(Board)` inside `$transaction`** — mocked Client proves the JS branches; Postgres `SELECT … FOR UPDATE` and `createMany` `skipDuplicates` without aborting the interactive transaction wait on a Prisma integration suite ([`testing.md`](./testing.md))

When closing a TODO, update this list; add a one-line note under **Already following** if it teaches a lasting pattern.

## Out of scope for now (not TODOs)

- Prisma Accelerate / Pulse / full edge Client setups unless we adopt them
- Switching database providers
- Parallel ORMs alongside Prisma
