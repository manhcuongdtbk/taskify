# Next.js

This repo is one place to learn **the Next.js App Router way** (plus how we wire Clerk, Prisma, Stripe, etc.). Prefer official Next.js docs for the version in `package.json`; for agents, also check bundled guides under `node_modules/next/dist/docs/01-app/` (see `AGENTS.md`).

Index of all project docs: [`README.md`](./README.md).
## Already following (keep as examples)

These are intentional patterns learners should copy unless a higher-priority official doc says otherwise:

- **Server Components by default**; `"use client"` only where interactivity/browser APIs need it
- **Await `params`** (and similar async request APIs) in pages/layouts/route handlers
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

## Guides we lean on (not duplicated here)

Prefer the official page over re-teaching it in this file:

| When you need… | Start here |
| -------------- | ---------- |
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

## TODO — follow Next.js recommendations more closely

Track gaps so the repo stays a faithful “Next.js way” reference. Check items off when the app (and any related docs) match the linked guidance. Prefer official patterns over new repo-only rules.

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
