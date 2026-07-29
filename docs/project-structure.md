# Project structure

How this repo is organized. Prefer existing conventions over inventing new ones — fewer custom rules means faster onboarding and less decision fatigue.

## How to read this doc

**Official Next.js reference (start here for framework rules):**  
[Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure)

That page covers folder/file conventions, route groups, private folders, colocation, and organization strategies. This doc only maps **what this repo uses** and where our choices sit on the priority list below.

Paths and UI entry points change — treat concrete examples as a starting index. Prefer searching the repo when in doubt. Full docs catalog: [`README.md`](./README.md).

### Convention priority

When something is ambiguous **about folder layout / routing structure**, follow this order (highest first). Use the highest rung that **owns this decision** (structure questions are usually Next.js / common folders — not Stripe or Prisma APIs).

1. **Next.js convention** — special files/folders the framework recognizes (`app/`, `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, `(group)`, `_folder`, `[param]`, …)
2. **Next.js recommendation** — strategies Next.js documents but does not enforce (e.g. store shared code outside `app/`, colocate with `_components`)
3. **React convention** — language/library rules (components, hooks naming, Server/Client Components where applicable)
4. **React recommendation** — common React guidance that isn’t a hard rule
5. **Common practice** — widely used app folders with **no** framework meaning (`components/`, `lib/`, `hooks/`, … — Next.js says these names are placeholders). Term defined in [`vocabulary.md`](./vocabulary.md).
6. **Repo convention** — only when the levels above don’t cover it; keep these rare

For language, TypeScript, and library choices, see [`conventions.md`](./conventions.md) and the [docs index](./README.md).

## Organization strategy we use

| Strategy                                                                                                                                 | Kind                   | In this repo                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Route groups](https://nextjs.org/docs/app/getting-started/project-structure#route-groups)                                               | Next.js convention     | e.g. `(marketing)`, `(platform)` organize layouts without changing URLs                                                                                                                         |
| [Store project files outside of `app`](https://nextjs.org/docs/app/getting-started/project-structure#store-project-files-outside-of-app) | Next.js recommendation | `app/` is primarily routing; shared code lives at the repo root                                                                                                                                 |
| [Private folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) + colocation                            | Next.js recommendation | Route-specific UI under `app/.../_components/` (not routable)                                                                                                                                   |
| [Font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file)                         | Next.js recommendation | Load shared `next/font` instances once (docs use `styles/fonts.ts` as the example path; alias `@/fonts` in `tsconfig.json`). The `styles/` folder name itself has no special framework meaning. |

We do **not** use a `src/` folder. Global CSS follows the App Router pattern in [app/globals.css](https://nextjs.org/docs/app/getting-started/css#tailwind-css) (not a root `styles/` CSS tree).

## Route splitting now → feature splitting later

Next.js lists several organization strategies and is [unopinionated](https://nextjs.org/docs/app/getting-started/project-structure#organizing-your-project) which you pick — including [split by feature or route](https://nextjs.org/docs/app/getting-started/project-structure#split-project-files-by-feature-or-route). This repo’s rule:

| Phase | Strategy | What it means here |
| ----- | -------- | ------------------ |
| **Now** | **Route-first** | Route-specific UI/helpers live next to the route (`app/.../_components/`, and other private folders under that segment). Truly shared code stays at the repo root (`components/`, `lib/`, `hooks/`, `actions/`, …). |
| **Later** | **Feature folders** (when triggered) | A shipped capability from [`features.md`](./features.md) that outgrows one route gets its own colocated module (UI + actions/helpers that almost always change together), instead of spreading across fat root folders. |

**Do not** big-bang migrate the whole tree “because the product vision grew.” Grow into feature splitting **one capability at a time** when a trigger below is true. Prefer route colocation for new work until then.

### Triggers to start a feature-oriented migration

Migrate **only that capability** (not the entire repo) when **any** of these hold:

1. **Multi-route ownership** — the same capability’s files regularly change across several routes (e.g. billing page + modal + webhook + server action) and nobody can point to one folder.
2. **Fat shared folders** — `components/`, `actions/`, or `lib/` for that area are hard to navigate; “where does X live?” keeps coming up in review.
3. **Cross-cutting churn** — PRs for one [`features.md`](./features.md) row repeatedly touch unrelated root files, or merges conflict because unrelated features share folders.
4. **Clear shipped boundary** — the capability is already a stable row in [`features.md`](./features.md) (not vision-only in [`product.md`](./product.md)).

### How to migrate when a trigger fires

1. Name the folder after the **shipped feature** (same language as [`features.md`](./features.md)).
2. Move that feature’s route-local and feature-only code together; leave genuinely shared primitives at the root (`components/ui/`, Prisma client, Clerk helpers, …).
3. Update [`features.md`](./features.md) “Start looking in” paths and this doc’s quick map in the **same** change.
4. Do **not** run two competing schemes for the same code (feature folder *and* a duplicate global tree) — see [What not to invent](#what-not-to-invent).

## In this repo (quick map)

Rows are grouped by Kind, in the same order as [Convention priority](#convention-priority).

| Path                    | Role                                                       | Kind                                |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------- |
| `app/`                  | App Router: pages, layouts, route handlers                 | Next.js convention                  |
| `app/(…)/`              | Route groups (marketing, platform, clerk, dashboard)       | Next.js convention                  |
| `app/.../_components/`  | Route-local UI (not in URL)                                | Next.js convention (`_`)            |
| `app/api/`              | Route handlers (`route.ts`)                                | Next.js convention                  |
| `public/`               | Static assets                                              | Next.js convention                  |
| `proxy.ts`              | Request proxy (authentication gating)                      | Next.js convention                  |
| `next.config.ts`        | Next.js config                                             | Next.js convention                  |
| `app/globals.css`       | Global CSS (Tailwind entry, etc.)                          | Next.js recommendation              |
| `styles/fonts.ts`       | Shared `next/font` definitions (`@/fonts`); not a CSS dump | Next.js recommendation              |
| `components/`           | Shared UI across routes (app-specific)                     | Common practice                     |
| `hooks/`                | Shared client hooks                                        | Common practice                     |
| `lib/`                  | Shared helpers and integrations                            | Common practice                     |
| `config/`               | App config; **product name** in `config/site.ts` (`siteConfig.name`) | Common practice                     |
| `constants/`            | App constants; **pricing plans** in `constants/pricing-plans.ts` | Common practice                     |
| `prisma/`               | Schema + migrations                                        | Common (Prisma)                     |
| `components/ui/`        | **shadcn/ui only** (CLI / registry primitives)             | Repo convention                     |
| `actions/`              | Server Actions grouped by feature                          | Repo convention (structure only)    |

Next.js does not assign special meaning to `components/`, `lib/`, `hooks/`, or `actions/` — see the [official examples note](https://nextjs.org/docs/app/getting-started/project-structure#examples).

## Next.js conventions we rely on (don’t relearn here)

Use the official page for definitions. In this repo you’ll see the usual App Router patterns: `layout` / `page` / `route`, dynamic segments, optional catch-alls (Clerk), route groups, private `_components` folders, and top-level `proxy.ts` for request gating (including keeping the Stripe webhook route reachable without a session).

Nested layouts compose shared shell UI and route guards. Details of layout nesting are in the Next.js docs under component hierarchy / nested routes.

## Choosing where UI lives

- **Route-only** UI → that route’s `_components/` (**route-first** — default now)
- **Shared app UI** (forms, modals, providers, logos, …) → `components/` (not under `ui/`)
- **shadcn primitives** → `components/ui/` only (`components.json` alias `"ui": "@/components/ui"`). Do not put hand-rolled app components there.
- **Feature module** → only after a [migration trigger](#triggers-to-start-a-feature-oriented-migration); colocate that feature’s code and point [`features.md`](./features.md) at it

Details for each top-level folder are in the [quick map](#in-this-repo-quick-map).

## Major areas (short)

Full shipped map: [`features.md`](./features.md). Vision / audience: [`product.md`](./product.md). Below is only a coarse pointer into the tree.

| Area | Start looking in |
| ---- | ---------------- |
| Authentication / organization selection | `proxy.ts`, `app/(platform)/(clerk)/` |
| Boards (lists / cards) | `app/(platform)/(dashboard)/board/` |
| Organization (home, settings, activity, billing) | `app/(platform)/(dashboard)/organization/` |
| Server mutations | `actions/` |
| Data models / DB access | `prisma/`, `lib/` (Prisma client) |

## Repo conventions (keep this list short)

Only the extras that aren’t covered by Next.js / React / common practice:

1. **Server Actions folder shape** — each action under `actions/<name>/` with `index.ts` (`"use server"`), `schema.ts` (Zod), `types.ts`, and a shared validation wrapper in `lib/` (`create-safe-action`).
2. **`components/ui/` is shadcn-only** — primitives from the shadcn CLI/registry live here; other shared UI goes under `components/` (e.g. `form/`, `modals/`, `providers/`) or route `_components/`.
3. **Say “organization,” not “org”** — in docs and UI copy write **organization**; keep `orgId` (and Clerk path segments like `select-org`) because those names come from Clerk / existing routes.
4. **Say “authentication,” not “auth”** — in docs and UI copy write **authentication**; keep Clerk identifiers such as `auth()`, `useAuth`, and similar because those names come from Clerk.
5. **Product name in `config/site.ts`** — app UI / metadata use `siteConfig.name` (not hardcoded brand strings). Docs and external dashboards are outside that file.
6. **Pricing plans in `constants/pricing-plans.ts`** — Free / Pro definitions (limits, price, Stripe product strings) live only there; docs describe pricing plans as defined in that file. Paid tier name is **Pro** (product name from `siteConfig`).
7. **Billing documentation** — change Stripe Checkout / Portal / webhooks or plan gating → update the Stripe billing guide (see [docs index](./README.md)) in the same change.

If you can solve a problem with a Next.js or common pattern instead of a new repo rule, do that.

## What not to invent

- Putting app-specific components in `components/ui/` (reserved for shadcn/ui)
- New top-level folders when an existing common folder (`components/`, `lib/`, `hooks/`) already fits
- Parallel organization schemes (e.g. feature folders _and_ a second global UI tree) without a clear need
- Big-bang “split everything by feature” before a [trigger](#triggers-to-start-a-feature-oriented-migration) — prefer route-first growth
- Re-documenting Next.js file conventions in this repo — link the official page and describe only this repo’s usage
