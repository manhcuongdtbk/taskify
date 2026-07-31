# Next.js

This repo is one place to learn **the Next.js App Router way** (plus how we wire Clerk, Prisma, Stripe, etc.).

| | |
| - | - |
| **Owner / SoT** | This file — App Router patterns we keep, framework TODOs, official-guide index (not a second data/auth map) |
| **Open when** | Choosing Next conventions (RSC vs client, Actions, `proxy.ts`, segment files, Link/Image) or closing a Next.js TODO |

Prefer official Next.js docs for the version in `package.json`; for agents, also check `node_modules/next/dist/docs/01-app/` (see `AGENTS.md`). Fetch/mutate map: [`data.md`](./data.md). Index: [`README.md`](./README.md).

**Page shape:** Already following → TODO → Out of scope → deep detail (guides table).

## Already following (keep as examples)

These are intentional patterns learners should copy unless a higher-priority official doc says otherwise:

- **Server Components by default**; `"use client"` only where interactivity/browser APIs need it
- **Await `params`** (and similar async request APIs) in pages/layouts/route handlers
- **`PageProps` / `LayoutProps`** when a `page.tsx` / `layout.tsx` (or its `generateMetadata`) declares props — see [Route props helpers](#route-props-helpers-pageprops--layoutprops)
- **Server Actions** (`"use server"`) for mutations, with authentication / authorization checks inside the action
- **`revalidatePath`** after successful mutations
- **Route Handlers** (`route.ts`) for HTTP endpoints (e.g. Stripe webhook)
- **`proxy.ts`** for request gating/redirects (not as the sole authorization layer)
- **`next/font`** via a [font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file) (`styles/fonts.ts` / `@/fonts`)
- **`next/image`** + `images.remotePatterns` in `next.config.ts` where we use the Image component
- **Metadata** via root metadata / `generateMetadata`
- **Secrets** kept server-side (not in `NEXT_PUBLIC_*`)
- **Server data fetching** uses Next’s [extended `fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch) when we call remote/HTTP APIs from Server Components (caching / `revalidate` / `tags`). **Client** TanStack Query uses Web `fetch` via `lib/fetcher.ts` — do not confuse the two

Official overview: [Production checklist](https://nextjs.org/docs/app/guides/production-checklist). Topic guide index: [Guides](https://nextjs.org/docs/app/guides). **Fetching & mutating map (this repo):** [`data.md`](./data.md). Engineering catalog: [`conventions.md`](./conventions.md#common-practices-catalog).

## TODO — follow Next.js recommendations more closely

Track gaps so the repo stays a faithful “Next.js way” reference. Check items off when the app (and any related docs) match the linked guidance. Prefer official patterns over new repo-only rules.

- [ ] **`RouteContext` on Route Handlers** — replace handwritten `{ params: Promise<…> }` in `app/api/**/route.ts` with `RouteContext<'/api/…'>` ([Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper)). Do this after `PageProps` / `LayoutProps` are settled ([below](#route-props-helpers-pageprops--layoutprops)).
- [ ] **Authorization / `proxy.ts` gating** — framework checklist lives in [`authentication-and-authorization.md`](./authentication-and-authorization.md) (**TODO — authorization**). Link Next [Data security](https://nextjs.org/docs/app/guides/data-security) / [Proxy](https://nextjs.org/docs/app/getting-started/proxy) from there; don’t duplicate the checkbox list here.
- [ ] **Expected errors as return values** — validation/business failures via returned state (e.g. `{ error }`), not thrown exceptions for expected cases ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling)); align with / extend `createSafeAction` where needed
- [ ] **Segment `error.tsx` / `not-found.tsx` (and optional `loading.tsx`)** — especially for board / organization routes; we already call `notFound()` in places but lack dedicated segment files ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling), [loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading), production checklist)
- [ ] **`<Link>` for in-app navigation** — prefer `next/link` over raw `<a>` for internal routes ([Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating))
- [ ] **`next/image` where it fits** — review CSS `backgroundImage` board / organization thumbnails vs Image optimization tradeoffs ([Images](https://nextjs.org/docs/app/getting-started/images))
- [ ] **Don’t call our own Route Handlers from Server Components** — keep server data access in Server Components / `lib/`; Route Handlers for clients/webhooks ([Production checklist](https://nextjs.org/docs/app/guides/production-checklist#data-fetching-and-caching))
- [ ] **Push `"use client"` boundaries down** — shrink client islands so Server Component trees stay the default ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components))

When closing a TODO, update this list and, if the change teaches a new pattern, a one-line note under **Already following** is enough — don’t duplicate Next.js docs here.

## Out of scope for now (not TODOs)

Only adopt when we deliberately need them:

- Broad ISR / `revalidateTag` / Cache Components redesign (we mostly use `revalidatePath`)
- `instrumentation.ts` / OpenTelemetry
- Partial Prerendering and other experimental caching modes

## Route props helpers (`PageProps` / `LayoutProps`)

Next generates **global** TypeScript helpers for App Router props. Prefer them over handwritten `{ params: Promise<{ … }> }` / `Readonly<{ children }>`. Official intro: [Layouts and Pages → Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers). TypeScript overview: [Route-Aware Type Helpers](https://nextjs.org/docs/app/api-reference/config/typescript#route-aware-type-helpers).

| Helper | Use on | Types |
| ------ | ------ | ----- |
| [`PageProps<'/route'>`](https://nextjs.org/docs/app/api-reference/file-conventions/page#page-props-helper) | `page.tsx` default export; also `generateMetadata` / `generateViewport` in a **page** file when they read `params` / `searchParams` | `params`, `searchParams` |
| [`LayoutProps<'/route'>`](https://nextjs.org/docs/app/api-reference/file-conventions/layout#layout-props-helper) | `layout.tsx` default export; also `generateMetadata` / `generateViewport` in a **layout** file when they read `params` | `params`, `children`, parallel-route slots |
| [`RouteContext<'/api/…'>`](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper) | `route.ts` handlers (2nd argument) — **not done yet** ([TODO](#todo--follow-nextjs-recommendations-more-closely)) | `params` |

**Repo rules**

1. **Literal must match generated routes** — use a path from `AppRoutes` / `LayoutRoutes` in `.next/dev/types/routes.d.ts` (regenerated by `next dev`, `next build`, or `next typegen`). Invalid literals fail typecheck.
2. **Route groups don’t appear in the literal** — `(platform)`, `(dashboard)`, `(clerk)`, `(marketing)` are folders only. Nested layouts that add no URL segment share `LayoutProps<'/'>` (e.g. marketing / platform / dashboard / clerk layouts).
3. **No hand-rolled `BoardIdPageProps`** — the global helper *is* the props type. Route export **names** still follow [`conventions.md`](./conventions.md#route-mirrored-pagelayout-names) (`BoardIdPage`, `BoardIdLayout`, …).
4. **Await `params` / `searchParams`** — they are `Promise`s; keep awaiting them (already in [Already following](#already-following-keep-as-examples)).
5. **Helper only when props are used** — omit the parameter entirely when you don’t read `params` / `searchParams` / `children` (e.g. `function MarketingPage()`). `({}: PageProps<'…'>)` is allowed but optional. **Enforced:** if the default export declares props (or a props type), they must use `PageProps` / `LayoutProps` with the correct literal — not a handwritten shape.
6. **`generateMetadata` may use the same helper** — even though the getting-started page shows helpers on page/layout components, [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) (and [`generateViewport`](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)) document typing the first argument with `PageProps` / `LayoutProps`. Example: `app/(platform)/(dashboard)/board/[boardId]/layout.tsx`. If metadata needs no params (org layout uses Clerk `auth()` only), omit the props parameter. **Enforced:** if `generateMetadata` / `generateViewport` declares parameters, they must use the same helper + literal as the file.

**Enforcement:** `scripts/check-route-export-names.ts` via `pnpm lint:routes` (also under `pnpm lint` and lint-staged on `app/**/{page,layout}.*`). `pnpm lint:routes:fix` rewrites export names and `PageProps` / `LayoutProps` when props are present (wrong/missing helper or literal; common handwritten `{ … }: { … }` shapes). Unusual signatures that can’t be rewritten safely still fail for a manual fix.

**Canonical examples in this repo**

- Page with params: `app/(platform)/(dashboard)/board/[boardId]/page.tsx` → `PageProps<'/board/[boardId]'>`
- Layout + `generateMetadata` with params: `app/(platform)/(dashboard)/board/[boardId]/layout.tsx` → `LayoutProps<'/board/[boardId]'>`
- Layout route segment without dynamic params: `app/(platform)/(dashboard)/organization/layout.tsx` → `LayoutProps<'/organization'>`
- Static / catch-all pages: marketing `PageProps<'/'>`, Clerk `PageProps<'/sign-in/[[...sign-in]]'>`, etc.

Do **not** put `PageProps` / `LayoutProps` on Route Handlers — that is `RouteContext` (TODO above). Skill-template apps under `.agents/` / `.claude/` are not product code; leave them alone.

## Guides we lean on (not duplicated here)

Prefer the official page over re-teaching it in this file:

| When you need… | Start here |
| -------------- | ---------- |
| Typed page / layout / route props | [Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) · [PageProps](https://nextjs.org/docs/app/api-reference/file-conventions/page#page-props-helper) · [LayoutProps](https://nextjs.org/docs/app/api-reference/file-conventions/layout#layout-props-helper) · [RouteContext](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper) · [this section](#route-props-helpers-pageprops--layoutprops) |
| Fetching (server + client) | [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) · [`data.md`](./data.md) |
| Mutating (Server Actions) | [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) · [`data.md`](./data.md) |
| Forms + Server Actions | [Forms](https://nextjs.org/docs/app/guides/forms) · [Server Actions](https://nextjs.org/docs/app/guides/server-actions) |
| Securing actions / data | [Data Security](https://nextjs.org/docs/app/guides/data-security) · **DAL** / **DTO** explained for this repo in [`data.md`](./data.md#dal-and-dto-not-auth-only) |
| Authentication concepts (Clerk today) | [Authentication](https://nextjs.org/docs/app/guides/authentication) · [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| Org / tenant patterns | [Multi-tenant](https://nextjs.org/docs/app/guides/multi-tenant) |
| BFF / Route Handlers vs UI mutations | [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) |
| MDX | [MDX](https://nextjs.org/docs/app/guides/mdx) |
| Env vars | [Environment Variables](https://nextjs.org/docs/app/guides/environment-variables) |
| Streaming | [Streaming](https://nextjs.org/docs/app/guides/streaming) |
| Server `fetch` caching | [Caching (previous model)](https://nextjs.org/docs/app/guides/caching-without-cache-components) · [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating) · vocabulary collision: [`data.md`](./data.md#cache-means-different-things-traditional-be-vs-next-vs-client) (not client `lib/fetcher.ts`) |
| Testing | [Testing](https://nextjs.org/docs/app/guides/testing) |
| Analytics | [Analytics](https://nextjs.org/docs/app/guides/analytics) |
| i18n | [Internationalization](https://nextjs.org/docs/app/guides/internationalization) |
| Redirects | [Redirecting](https://nextjs.org/docs/app/guides/redirecting) |
| CSP | [Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy) |
| CI cache | [CI Build Caching](https://nextjs.org/docs/app/guides/ci-build-caching) |

Anything not listed stays in the [Guides index](https://nextjs.org/docs/app/guides) until we have a concrete TODO or catalog row.

