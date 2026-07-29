# Taskify Project Structure

How this repo is organized. Prefer existing conventions over inventing new ones — fewer custom rules means faster onboarding and less decision fatigue.

## How to read this doc

**Official Next.js reference (start here for framework rules):**  
[Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure)

That page covers folder/file conventions, route groups, private folders, colocation, and organization strategies. This doc only maps **what Taskify uses** and where our choices sit on the priority list below.

Paths and UI entry points change — treat concrete examples as a starting index. Prefer searching the repo when in doubt. Full docs catalog: [`README.md`](./README.md).

### Convention priority

When something is ambiguous **about folder layout / routing structure**, follow this order (highest first). Use the highest rung that **owns this decision** (structure questions are usually Next.js / common folders — not Stripe or Prisma APIs).

1. **Next.js convention** — special files/folders the framework recognizes (`app/`, `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, `(group)`, `_folder`, `[param]`, …)
2. **Next.js recommendation** — strategies Next.js documents but does not enforce (e.g. store shared code outside `app/`, colocate with `_components`)
3. **React convention** — language/library rules (components, hooks naming, Server/Client Components where applicable)
4. **React recommendation** — common React guidance that isn’t a hard rule
5. **Common convention** — widely used app folders with **no** framework meaning (`components/`, `lib/`, `hooks/`, … — Next.js says these names are placeholders)
6. **Taskify convention** — only when the levels above don’t cover it; keep these rare

For language, TypeScript, and library choices, see [`conventions.md`](./conventions.md) and the [docs index](./README.md).

## Organization strategy we use

| Strategy                                                                                                                                 | Kind                   | In this repo                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Route groups](https://nextjs.org/docs/app/getting-started/project-structure#route-groups)                                               | Next.js convention     | e.g. `(marketing)`, `(platform)` organize layouts without changing URLs                                                                                                                         |
| [Store project files outside of `app`](https://nextjs.org/docs/app/getting-started/project-structure#store-project-files-outside-of-app) | Next.js recommendation | `app/` is primarily routing; shared code lives at the repo root                                                                                                                                 |
| [Private folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) + colocation                            | Next.js recommendation | Route-specific UI under `app/.../_components/` (not routable)                                                                                                                                   |
| [Font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file)                         | Next.js recommendation | Load shared `next/font` instances once (docs use `styles/fonts.ts` as the example path; alias `@/fonts` in `tsconfig.json`). The `styles/` folder name itself has no special framework meaning. |

We do **not** use a `src/` folder. Global CSS follows the App Router pattern in [app/globals.css](https://nextjs.org/docs/app/getting-started/css#tailwind-css) (not a root `styles/` CSS tree).

## In this repo (quick map)

Rows are grouped by Kind, in the same order as [Convention priority](#convention-priority).

| Path                    | Role                                                       | Kind                                |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------- |
| `app/`                  | App Router: pages, layouts, route handlers                 | Next.js convention                  |
| `app/(…)/`              | Route groups (marketing, platform, auth, dashboard)        | Next.js convention                  |
| `app/.../_components/`  | Route-local UI (not in URL)                                | Next.js convention (`_`)            |
| `app/api/`              | Route handlers (`route.ts`)                                | Next.js convention                  |
| `public/`               | Static assets                                              | Next.js convention                  |
| `proxy.ts`              | Request proxy (auth gating)                                | Next.js convention                  |
| `next.config.ts`        | Next.js config                                             | Next.js convention                  |
| `app/globals.css`       | Global CSS (Tailwind entry, etc.)                          | Next.js recommendation              |
| `styles/fonts.ts`       | Shared `next/font` definitions (`@/fonts`); not a CSS dump | Next.js recommendation              |
| `components/`           | Shared UI across routes (app-specific)                     | Common convention                   |
| `hooks/`                | Shared client hooks                                        | Common convention                   |
| `lib/`                  | Shared helpers and integrations                            | Common convention                   |
| `config/`               | App config; **product name** in `config/site.ts` (`siteConfig.name`) | Common convention                   |
| `constants/`            | App constants; **plans** live in `constants/plans.ts`      | Common convention                   |
| `prisma/`               | Schema + migrations                                        | Common (Prisma)                     |
| `components/ui/`        | **shadcn/ui only** (CLI / registry primitives)             | Taskify convention                  |
| `actions/`              | Server Actions grouped by feature                          | Taskify convention (structure only) |

Next.js does not assign special meaning to `components/`, `lib/`, `hooks/`, or `actions/` — see the [official examples note](https://nextjs.org/docs/app/getting-started/project-structure#examples).

## Next.js conventions we rely on (don’t relearn here)

Use the official page for definitions. In Taskify you’ll see the usual App Router patterns: `layout` / `page` / `route`, dynamic segments, optional catch-alls (Clerk), route groups, private `_components` folders, and top-level `proxy.ts` for request gating (including keeping the Stripe webhook route reachable without a session).

Nested layouts compose shared shell UI and route guards. Details of layout nesting are in the Next.js docs under component hierarchy / nested routes.

## Choosing where UI lives

- **Route-only** UI → that route’s `_components/`
- **Shared app UI** (forms, modals, providers, logos, …) → `components/` (not under `ui/`)
- **shadcn primitives** → `components/ui/` only (`components.json` alias `"ui": "@/components/ui"`). Do not put hand-rolled app components there.

Details for each top-level folder are in the [quick map](#in-this-repo-quick-map).

## Major areas (short)

Full product map: [`features.md`](./features.md). Below is only a coarse pointer into the tree.

| Area | Start looking in |
| ---- | ---------------- |
| Auth / organization selection | `proxy.ts`, `app/(platform)/(clerk)/` |
| Boards (lists / cards) | `app/(platform)/(dashboard)/board/` |
| Organization (home, settings, activity, billing) | `app/(platform)/(dashboard)/organization/` |
| Server mutations | `actions/` |
| Data models / DB access | `prisma/`, `lib/` (Prisma client) |

## Taskify conventions (keep this list short)

Only the extras that aren’t covered by Next.js / React / common practice:

1. **Server Actions folder shape** — each action under `actions/<name>/` with `index.ts` (`"use server"`), `schema.ts` (Zod), `types.ts`, and a shared validation wrapper in `lib/` (`create-safe-action`).
2. **`components/ui/` is shadcn-only** — primitives from the shadcn CLI/registry live here; other shared UI goes under `components/` (e.g. `form/`, `modals/`, `providers/`) or route `_components/`.
3. **Say “organization,” not “org”** — in docs and UI copy write **organization**; keep `orgId` (and Clerk path segments like `select-org`) because those names come from Clerk / existing routes.
4. **Product name in `config/site.ts`** — app UI / metadata use `siteConfig.name` (not hardcoded brand strings). Docs and external dashboards are outside that file.
5. **Plans in `constants/plans.ts`** — Free / Pro definitions (limits, price, Stripe product strings) live only there; docs describe plans as defined in that file. Plan name is **Pro** (product name from `siteConfig`).
6. **Billing documentation** — change Stripe Checkout / Portal / webhooks or plan gating → update the Stripe billing guide (see [docs index](./README.md)) in the same change.

If you can solve a problem with a Next.js or common pattern instead of a new Taskify rule, do that.

## What not to invent

- Putting app-specific components in `components/ui/` (reserved for shadcn/ui)
- New top-level folders when an existing common folder (`components/`, `lib/`, `hooks/`) already fits
- Parallel organization schemes (e.g. feature folders _and_ a second global UI tree) without a clear need
- Re-documenting Next.js file conventions in this repo — link the official page and describe only Taskify’s usage
