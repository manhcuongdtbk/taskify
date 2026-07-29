# Next.js

This repo is one place to learn **the Next.js App Router way** (plus how we wire Clerk, Prisma, Stripe, etc.). Prefer official Next.js docs for the version in `package.json`; for agents, also check bundled guides under `node_modules/next/dist/docs/01-app/` (see `AGENTS.md`).

Index of all project docs: [`README.md`](./README.md).
## Already following (keep as examples)

These are intentional patterns learners should copy unless a higher-priority official doc says otherwise:

- **Server Components by default**; `"use client"` only where interactivity/browser APIs need it
- **Await `params`** (and similar async request APIs) in pages/layouts/route handlers
- **Server Actions** (`"use server"`) for mutations, with auth checks inside the action
- **`revalidatePath`** after successful mutations
- **Route Handlers** (`route.ts`) for HTTP endpoints (e.g. Stripe webhook)
- **`proxy.ts`** for request gating/redirects (not as the sole authorization layer)
- **`next/font`** via a [font definitions file](https://nextjs.org/docs/app/api-reference/components/font#using-a-font-definitions-file) (`styles/fonts.ts` / `@/fonts`)
- **`next/image`** + `images.remotePatterns` in `next.config.ts` where we use the Image component
- **Metadata** via root metadata / `generateMetadata`
- **Secrets** kept server-side (not in `NEXT_PUBLIC_*`)

Official overview: [Production checklist](https://nextjs.org/docs/app/guides/production-checklist).

## TODO — follow Next.js recommendations more closely

Track gaps so the repo stays a faithful “Next.js way” reference. Check items off when the app (and any related docs) match the linked guidance. Prefer official patterns over new repo-only rules.

- [ ] **Authz in every Server Action and Route Handler** — assume actions are POSTable directly; verify auth/ownership inside each one ([Data security](https://nextjs.org/docs/app/guides/data-security), [Mutating data](https://nextjs.org/docs/app/getting-started/mutating-data))
- [ ] **Expected errors as return values** — validation/business failures via returned state (e.g. `{ error }`), not thrown exceptions for expected cases ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling)); align with / extend `createSafeAction` where needed
- [ ] **Segment `error.tsx` / `not-found.tsx` (and optional `loading.tsx`)** — especially for board / organization routes; we already call `notFound()` in places but lack dedicated segment files ([Error handling](https://nextjs.org/docs/app/getting-started/error-handling), [loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading), production checklist)
- [ ] **`<Link>` for in-app navigation** — prefer `next/link` over raw `<a>` for internal routes ([Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating))
- [ ] **`next/image` where it fits** — review CSS `backgroundImage` board / organization thumbnails vs Image optimization tradeoffs ([Images](https://nextjs.org/docs/app/getting-started/images))
- [ ] **Don’t call our own Route Handlers from Server Components** — keep server data access in Server Components / `lib/`; Route Handlers for clients/webhooks ([Production checklist](https://nextjs.org/docs/app/guides/production-checklist#data-fetching-and-caching))
- [ ] **Keep `proxy.ts` to optimistic gating** — full session/authorization stays in pages, layouts, and actions; finish Clerk’s guidance on public routes / less middleware-centric checks ([Proxy](https://nextjs.org/docs/app/getting-started/proxy), Clerk custom sign-in notes linked from `proxy.ts`)
- [ ] **Push `"use client"` boundaries down** — shrink client islands so Server Component trees stay the default ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components))

When closing a TODO, update this list and, if the change teaches a new pattern, a one-line note under **Already following** is enough — don’t duplicate Next.js docs here.

## Out of scope for now (not TODOs)

Only adopt when we deliberately need them:

- Broad ISR / `revalidateTag` / Cache Components redesign (we mostly use `revalidatePath`)
- `instrumentation.ts` / OpenTelemetry
- Partial Prerendering and other experimental caching modes
