# Clerk in Taskify

Learning reference for **Clerk** auth and **Organizations** in this Next.js App Router app. Prefer [Clerk docs](https://clerk.com/docs) for the SDK version in `package.json`. Repo Clerk skills under `.claude/skills/clerk*` can help with setup, Organizations, and Next.js patterns.

Index of all project docs: [`README.md`](./README.md). **Billing** (Stripe) is keyed by Clerk `orgId` — see the Stripe guide in the index when changing Checkout metadata / webhooks.

In prose, write **organization** (not “org”). Keep `orgId` as Clerk names it.

## Already following (keep as examples)

- **`ClerkProvider`** on the platform shell (`components/clerk-provider.tsx`) with Clerk’s [shadcn appearance theme](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/themes#shadcn-theme)
- **Hosted auth UI** via App Router catch-alls: `sign-in`, `sign-up`, `select-org` under `app/(platform)/(clerk)/`
- **Organizations** — `OrganizationList` / `OrganizationSwitcher` / `UserButton`; product data is tenanted by `orgId`
- **`auth()` / `currentUser()`** from `@clerk/nextjs/server` inside Server Actions, layouts, and helpers (`lib/subscription.ts`, `lib/organization-limit.ts`)
- **`clerkMiddleware` in `proxy.ts`** — public marketing + Stripe webhook; redirect unauthenticated users; require an active organization for protected app routes
- **Organization id in Stripe** — Checkout `metadata.orgId` so webhooks can link subscriptions (Stripe guide in the [docs index](./README.md))

## TODO — follow Clerk / auth recommendations more closely

Check items off when the app (and this doc) match current Clerk + Next.js guidance. Prefer official patterns over new Taskify-only rules.

- [ ] **Reduce middleware-centric auth** — finish the TODO in `proxy.ts` toward Clerk’s public-route / less middleware-heavy guidance ([custom sign-in public routes](https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page#make-the-route-public)); keep real authorization in actions/pages ([Next.js proxy](https://nextjs.org/docs/app/getting-started/proxy))
- [ ] **Organization activation UX** — revisit `organization-control.tsx` TODO ([set active by slug changelog](https://clerk.com/changelog/2024-08-02-set-active-by-slug)) and use the current Clerk recommended API
- [ ] **Authz checklist with Next.js** — every Server Action / protected Route Handler verifies `userId` / `orgId` (and resource ownership) — shared with [`nextjs.md`](./nextjs.md) security TODO
- [ ] **Document required Clerk Dashboard / env setup** for contributors (keys, Organizations enabled, paths for sign-in/up) in a short “Local setup” section here when stabilized — don’t put secrets in the repo
- [ ] **Align public route list** — keep `/api/webhook` public for Stripe; review whether any other routes should be public or session-optional as the app grows

When closing a TODO, update this list; add a one-line note under **Already following** if it teaches a lasting pattern.

## Out of scope for now (not TODOs)

- Replacing Stripe **billing** with Clerk Billing (see Stripe guide in the [docs index](./README.md) — don’t add a parallel billing stack unless explicitly requested)
- Enterprise SSO / advanced organization RBAC beyond what the app already uses
- Native mobile Clerk SDKs
