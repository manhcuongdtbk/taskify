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
- **`PageProps` / `LayoutProps`** when a `page.tsx` / `layout.tsx` (or its `generateMetadata`) declares props — see [Route props helpers](#route-props-helpers-pageprops--layoutprops--routecontext)
- **`RouteContext`** when a `route.ts` HTTP handler declares a context/`params` argument — same section
- **`NextRequest` / `NextResponse`** in `route.ts` when the handler takes a request or returns a response — see [Route Handlers: NextRequest / NextResponse](#route-handlers-nextrequest--nextresponse)
- **`typedRoutes` + slim `lib/paths`** (cast-needed URLs only) for in-app links / redirects — see [Typed routes and env](#typed-routes-and-env)
- **`Link` for in-app routes; plain `<a>` for external URLs** — see [Link vs `<a>`](#link-vs-a)
- **`experimental.typedEnv`** so `process.env` keys get IntelliSense from loaded `.env*` — see [Typed routes and env](#typed-routes-and-env)
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

- [ ] **Authorization / `proxy.ts` gating** — framework checklist lives in [`authentication-and-authorization.md`](./authentication-and-authorization.md) (**TODO — authorization**). Link Next [Data security](https://nextjs.org/docs/app/guides/data-security) / [Proxy](https://nextjs.org/docs/app/getting-started/proxy) from there; don’t duplicate the checkbox list here.
- [ ] **Expected errors as return values** — validation/business failures via returned state (e.g. `{ error }`), not thrown exceptions for expected cases ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling)); align with / extend `createSafeAction` where needed
- [ ] **Segment `error.tsx` / `not-found.tsx` (and optional `loading.tsx`)** — especially for board / organization routes; we already call `notFound()` in places but lack dedicated segment files ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling), [loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading), production checklist)
- [ ] **`next/image` where it fits** — review CSS `backgroundImage` board / organization thumbnails vs Image optimization tradeoffs ([Images](https://nextjs.org/docs/app/getting-started/images))
- [ ] **Don’t call our own Route Handlers from Server Components** — keep server data access in Server Components / `lib/`; Route Handlers for clients/webhooks ([Production checklist](https://nextjs.org/docs/app/guides/production-checklist#data-fetching-and-caching))
- [ ] **Push `"use client"` boundaries down** — shrink client islands so Server Component trees stay the default ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components))

When closing a TODO, update this list and, if the change teaches a new pattern, a one-line note under **Already following** is enough — don’t duplicate Next.js docs here.

## Out of scope for now (not TODOs)

Only adopt when we deliberately need them:

- Broad ISR / `revalidateTag` / Cache Components redesign (we mostly use `revalidatePath`)
- `instrumentation.ts` / OpenTelemetry
- Partial Prerendering and other experimental caching modes

## Route props helpers (`PageProps` / `LayoutProps` / `RouteContext`)

Next generates **global** TypeScript helpers for App Router props. Prefer them over handwritten `{ params: Promise<{ … }> }` / `Readonly<{ children }>`. Official intro: [Layouts and Pages → Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers). Route Handlers: [Route Context Helper](https://nextjs.org/docs/app/getting-started/route-handlers#route-context-helper). TypeScript overview: [Route-Aware Type Helpers](https://nextjs.org/docs/app/api-reference/config/typescript#route-aware-type-helpers).

| Helper | Use on | Types |
| ------ | ------ | ----- |
| [`PageProps<'/route'>`](https://nextjs.org/docs/app/api-reference/file-conventions/page#page-props-helper) | `page.tsx` default export; also `generateMetadata` / `generateViewport` in a **page** file when they read `params` / `searchParams` | `params`, `searchParams` |
| [`LayoutProps<'/route'>`](https://nextjs.org/docs/app/api-reference/file-conventions/layout#layout-props-helper) | `layout.tsx` default export; also `generateMetadata` / `generateViewport` in a **layout** file when they read `params` | `params`, `children`, parallel-route slots |
| [`RouteContext<'/api/…'>`](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper) | `route.ts` HTTP method handlers — **2nd argument** when you read `params` | `params` |

**Repo rules**

1. **Literal must match generated routes** — use a path from `AppRoutes` / `LayoutRoutes` / `AppRouteHandlerRoutes` in `.next/dev/types/routes.d.ts` (regenerated by `next dev`, `next build`, or `next typegen`). Invalid literals fail typecheck.
2. **Route groups don’t appear in the literal** — `(platform)`, `(dashboard)`, `(clerk)`, `(marketing)` are folders only. Nested layouts that add no URL segment share `LayoutProps<'/'>` (e.g. marketing / platform / dashboard / clerk layouts).
3. **No hand-rolled `BoardIdPageProps`** — the global helper *is* the props type. Route export **names** still follow [`conventions.md`](./conventions.md#route-mirrored-pagelayout-names) (`BoardIdPage`, `BoardIdLayout`, …). HTTP method names on `route.ts` stay `GET` / `POST` / … (framework-required).
4. **Await `params` / `searchParams`** — they are `Promise`s; keep awaiting them (already in [Already following](#already-following-keep-as-examples)).
5. **Helper only when props/context are used** — omit the parameter entirely when you don’t read `params` / `searchParams` / `children` (e.g. `function MarketingPage()`, webhook `POST(req)` with no context). `({}: PageProps<'…'>)` is allowed but optional. **Enforced:** if the default export declares props (or a props type), they must use `PageProps` / `LayoutProps` with the correct literal. If a Route Handler declares a 2nd argument, it must be `RouteContext<'…'>` with the correct literal.
6. **`generateMetadata` may use the same helper** — even though the getting-started page shows helpers on page/layout components, [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) (and [`generateViewport`](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)) document typing the first argument with `PageProps` / `LayoutProps`. Example: `app/(platform)/(dashboard)/board/[boardId]/layout.tsx`. If metadata needs no params (org layout uses Clerk `auth()` only), omit the props parameter. **Enforced:** if `generateMetadata` / `generateViewport` declares parameters, they must use the same helper + literal as the file.

**Enforcement:** `scripts/check-route-export-names.ts` via `pnpm lint:routes` (also under `pnpm lint` and lint-staged on `app/**/{page,layout,route}.*`). `pnpm lint:routes:fix` rewrites export names, `PageProps` / `LayoutProps`, and `RouteContext` for common shapes. Unusual signatures that can’t be rewritten safely still fail for a manual fix.

**Canonical examples in this repo**

- Page with params: `app/(platform)/(dashboard)/board/[boardId]/page.tsx` → `PageProps<'/board/[boardId]'>`
- Layout + `generateMetadata` with params: `app/(platform)/(dashboard)/board/[boardId]/layout.tsx` → `LayoutProps<'/board/[boardId]'>`
- Layout route segment without dynamic params: `app/(platform)/(dashboard)/organization/layout.tsx` → `LayoutProps<'/organization'>`
- Static / catch-all pages: marketing `PageProps<'/'>`, Clerk `PageProps<'/sign-in/[[...sign-in]]'>`, etc.
- Route Handler with params: `app/api/cards/[cardId]/route.ts` → `RouteContext<'/api/cards/[cardId]'>`
- Route Handler without context: `app/api/webhook/route.ts` (`POST(req)` only) — no `RouteContext` needed

## Route Handlers: `NextRequest` / `NextResponse`

Prefer Next’s extended APIs over the bare Web [`Request`](https://developer.mozilla.org/docs/Web/API/Request) / [`Response`](https://developer.mozilla.org/docs/Web/API/Response) in `route.ts`. Official: [Extended NextRequest and NextResponse](https://nextjs.org/docs/app/getting-started/route-handlers#extended-nextrequest-and-nextresponse-apis) · [`NextRequest`](https://nextjs.org/docs/app/api-reference/functions/next-request) · [`NextResponse`](https://nextjs.org/docs/app/api-reference/functions/next-response).

| API | Use when | Adds |
| --- | -------- | ---- |
| `NextRequest` | Handler declares a request parameter | `cookies`, `nextUrl`, … |
| `NextResponse` | Handler returns a response | `cookies`, `json`, `redirect`, `rewrite`, `next`, … |

**Repo rules**

1. **Request param → `NextRequest`** — if an HTTP method export takes a 1st argument, type it as `NextRequest` (not `Request`). Omit the argument entirely when unused (`export async function GET()`).
2. **Responses → `NextResponse`** — use `NextResponse.json` / `new NextResponse` / `NextResponse.redirect` (not `Response.json` / `new Response`).
3. **Still use `RouteContext`** for the 2nd argument when you read `params` ([above](#route-props-helpers-pageprops--layoutprops--routecontext)).

**Enforcement:** same `pnpm lint:routes` / `pnpm lint:routes:fix` script (autofixes `Request` → `NextRequest`, bare `Response` → `NextResponse`, and adds `next/server` imports).

Skill-template apps under `.agents/` / `.claude/` are not product code; leave them alone.

## Typed routes and env

Official: [Statically Typed Links](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links) · [Type IntelliSense for Environment Variables](https://nextjs.org/docs/app/api-reference/config/typescript#type-intellisense-for-environment-variables). Config lives in `next.config.ts`.

| Flag | Effect |
| ---- | ------ |
| `typedRoutes: true` | `Link` `href`, `redirect`, `router.push` / `replace` must be valid app routes (or `Route`) |
| `experimental.typedEnv: true` | During `next dev`, writes `.next/dev/types/env.d.ts` with keys from loaded `.env*` for `process.env` IntelliSense |

**Repo rules**

1. **`lib/paths.ts` is only for routes that need a `Route` cast** — optional catch-alls (`/sign-in`, `/sign-up`, `/select-org`) and dynamic templates (`paths.board(id)`, …). Don’t add static entries that typecheck as bare literals; use inline `"/"`, `"/protected"`, … instead. Inside the file, cast once via the private `route()` helper — not `as Route` on every entry.
2. **Use `paths.*` at call sites** when a helper exists (catch-alls / dynamics). Don’t cast with `as Route` outside `lib/paths.ts`.
3. **External URLs** — use a plain `<a>` ([Link vs `<a>`](#link-vs-a)); do not cast them as `Route` for `Link`.
4. **`proxy.ts` / `new URL(path, req.url)`** — string paths for middleware redirects are fine; they are not the typed `Link`/`redirect` APIs.
5. **`typedEnv` is IntelliSense, not runtime validation** — keys are optional `string`s based on whatever `next dev` loaded. Still keep secrets out of `NEXT_PUBLIC_*`. Production-only vars need `NODE_ENV=production` during `next dev` (or equivalent) to appear in the generated `.d.ts`.
6. **Regenerate types** with `next typegen`, `next dev`, or `next build`. `tsconfig.json` already includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts`.

**Common practice (path helpers, not a route table)**

Centralizing path strings / builders (`paths.ts`, `routes.ts`, `links.ts`, …) is a widespread frontend habit. You’ll see the same *idea* next to [React Router](https://reactrouter.com/) (path constants + helpers like [`generatePath`](https://api.reactrouter.com/v7/functions/react-router.generatePath.html)) and [Vue Router](https://router.vuejs.org/) (often **named routes** / path constants beside the router config). Some codebases put *every* URL there; **this repo keeps a slim map** — only paths that need a `typedRoutes` cast — so the file doesn’t look like every link must go through `paths`.

**Do not confuse that habit with those libraries’ route tables.** In React Router / Vue Router, a central file often *registers* path → component (the router consumes it). In the App Router, the `app/` tree still owns routing; `lib/paths.ts` only **mirrors** cast-needed URLs for typed links / redirects under [`typedRoutes`](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links).

**Enforcement**

| Check | How |
| ----- | --- |
| Valid in-app routes | `typedRoutes` + `pnpm typecheck` (also under `pnpm lint`) |
| `as Route` only in `lib/paths.ts` | ESLint `no-restricted-syntax` in `eslint.config.mjs` (all files except `lib/paths.ts`) — pushes catch-alls / dynamics through `paths.*` |
| External `Link` / `target="_blank"` | [Link vs `<a>`](#link-vs-a) |

Static literals (`"/"`) are not forced through `paths` — they don’t need a cast. `proxy.ts` string paths are out of scope for this rule.

## Link vs `<a>`

| Destination | Use | Why |
| ----------- | --- | --- |
| In-app route (`/board/…`, `paths.*`, …) | `next/link` (`Link`) | Client navigation + prefetch; `typedRoutes` |
| External (`https://…`, `mailto:`, `tel:`, `sms:`) | Plain `<a>` | Full browser navigation; no `Route` cast |

Repo example: Unsplash attribution in `components/form/form-picker.tsx` uses `<a href={image.links.html} …>`.

**Enforcement (ESLint in `eslint.config.mjs`)**

1. **Internal `<a>` → `Link`** — `@next/next/no-html-link-for-pages` (error). Official: [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) · [`no-html-link-for-pages`](https://nextjs.org/docs/messages/no-html-link-for-pages).
2. **External `Link` → `<a>`** — `no-restricted-syntax` on `Link` `href` literals / templates / `pathname` objects starting with `http(s):` / `mailto:` / `tel:` / `sms:`, and on casting those as `Route`.
3. **`target="_blank"` → safe `rel`** — `react/jsx-no-target-blank` (error): require `rel` that includes `noopener` and/or `noreferrer` (tabnabbing).

**Gap:** a dynamic string (e.g. `href={image.links.html}`) on `Link` is not AST-detectable as external — still use `<a>` by convention; `typedRoutes` usually still fails unless you cast.

## Guides we lean on (not duplicated here)

Prefer the official page over re-teaching it in this file:

| When you need… | Start here |
| -------------- | ---------- |
| Typed page / layout / route props | [Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) · [Route Context Helper](https://nextjs.org/docs/app/getting-started/route-handlers#route-context-helper) · [PageProps](https://nextjs.org/docs/app/api-reference/file-conventions/page#page-props-helper) · [LayoutProps](https://nextjs.org/docs/app/api-reference/file-conventions/layout#layout-props-helper) · [RouteContext](https://nextjs.org/docs/app/api-reference/file-conventions/route#route-context-helper) · [this section](#route-props-helpers-pageprops--layoutprops--routecontext) |
| `NextRequest` / `NextResponse` in Route Handlers | [Extended APIs](https://nextjs.org/docs/app/getting-started/route-handlers#extended-nextrequest-and-nextresponse-apis) · [`NextRequest`](https://nextjs.org/docs/app/api-reference/functions/next-request) · [`NextResponse`](https://nextjs.org/docs/app/api-reference/functions/next-response) · [this section](#route-handlers-nextrequest--nextresponse) |
| Typed `Link` / navigation / env IntelliSense | [Statically Typed Links](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links) · [typedEnv](https://nextjs.org/docs/app/api-reference/config/typescript#type-intellisense-for-environment-variables) · [this section](#typed-routes-and-env) · `lib/paths.ts` |
| `Link` vs `<a>` (in-app vs external) | [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) · [`Link`](https://nextjs.org/docs/app/api-reference/components/link) · [this section](#link-vs-a) |
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

