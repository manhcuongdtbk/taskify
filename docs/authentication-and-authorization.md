# Authentication and authorization

Learning reference for **authentication** and **authorization** in this app. **Clerk** is the current **authentication provider** (plus Organizations); it may be replaced later — the concern names stay.

|                 |                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Owner / SoT** | This file — Clerk wiring map, authentication TODOs, **authorization checklist** (don’t duplicate elsewhere)         |
| **Open when**   | Session / organization gating, `proxy.ts`, Server Action checks, tenant `orgId` scoping, or authorization hardening |

Prefer [Clerk docs](https://clerk.com/docs) for the SDK in `package.json`. Repo skills under `.claude/skills/clerk*` help with setup. Index: [`README.md`](./README.md). Billing `orgId` coupling: [`billing.md`](./billing.md). Provider _why_: [`product.md`](./product.md). Prose rules: [`vocabulary.md`](./vocabulary.md). Keep Clerk identifiers such as `auth()`, `useAuth`, and `orgId`.

**Page shape:** Already following → TODO → Out of scope → deep detail (why Clerk now).

## Already following (keep as examples)

### Authentication

- **`ClerkProvider`** on the platform shell (`components/clerk-provider.tsx`) with Clerk’s [shadcn appearance theme](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/themes#shadcn-theme)
- **Hosted authentication UI** via App Router catch-alls: `sign-in`, `sign-up`, `select-org` under `app/(platform)/(clerk)/`
- **Organizations** — `OrganizationList` / `OrganizationSwitcher` / `UserButton`; product data is tenanted by `orgId`
- **`auth()` / `currentUser()`** from `@clerk/nextjs/server` inside Server Actions, layouts, and helpers (`lib/subscription.ts`, `lib/organization-limit.ts`)
- **`clerkMiddleware` in `proxy.ts`** — public marketing + Stripe webhook; redirect unauthenticated users; require an active organization for protected app routes
- **Organization id in billing** — Checkout `metadata.orgId` so webhooks can link subscriptions ([`billing.md`](./billing.md))

### Authorization (thin — what we have today)

Not a full permissions product. Today we only:

- **Require a session + active organization** before protected mutations (`userId` / `orgId` checks in Server Actions and card Route Handlers)
- **Tenant isolation** — board/list/card queries scoped with `orgId` so one organization cannot mutate another’s data by id alone
- **Pricing-plan entitlements** — Free board caps / Pro via `checkSubscription` + `organization-limit` (see [`features.md`](./features.md) / [`billing.md`](./billing.md))

We do **not** yet enforce organization **roles** (admin vs member) or fine-grained action permissions.

## TODO — authentication

Check items off when the app (and this doc) match current Clerk + Next.js guidance. Prefer official patterns over new repo-only rules.

- [ ] **Reduce middleware-centric authentication** — finish the TODO in `proxy.ts` toward Clerk’s public-route / less middleware-heavy guidance ([custom sign-in public routes](https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page#make-the-route-public)); keep real authorization in actions/pages ([Next.js proxy](https://nextjs.org/docs/app/getting-started/proxy))
- [ ] **Organization activation UX** — revisit `organization-control.tsx` TODO ([set active by slug changelog](https://clerk.com/changelog/2024-08-02-set-active-by-slug)) and use the current Clerk recommended API
- [ ] **Document required Clerk Dashboard / env setup** for contributors (keys, Organizations enabled, paths for sign-in/up) in a short “Local setup” section here when stabilized — don’t put secrets in the repo
- [ ] **Align public route list** — keep `/api/webhook` public for Stripe; review whether any other routes should be public or session-optional as the app grows

## TODO — authorization (harden what we already claim)

These are **gaps in today’s thin model**, not a greenfield RBAC feature. **Source of truth for this checklist** — [`nextjs.md`](./nextjs.md) only links here; don’t maintain a second copy.

- [ ] **Every Server Action / protected Route Handler** verifies authentication (`userId`), active organization (`orgId`), and **resource ownership** (row belongs to that `orgId`) — assume actions are POSTable directly ([Data security](https://nextjs.org/docs/app/guides/data-security), [Mutating data](https://nextjs.org/docs/app/getting-started/mutating-data))
- [ ] **Audit coverage** — spot-check actions/APIs that might only check `userId`/`orgId` without scoping the Prisma `where` to the organization
- [ ] **HTTP meaning** — prefer clear failure shapes: unauthenticated vs not allowed (today many paths return the string `"Unauthorized"` for both; don’t invent a house protocol, but don’t blur the two ideas in new code)
- [ ] **Keep `proxy.ts` optimistic only** — session/organization gating in the proxy; full authorization stays in pages, layouts, and actions ([Proxy](https://nextjs.org/docs/app/getting-started/proxy)); finish Clerk public-route guidance under [TODO — authentication](#todo--authentication)

When closing a TODO, update this list; add a one-line note under **Already following** if it teaches a lasting pattern.

## Out of scope for now (not TODOs)

- Replacing Stripe **billing** with Clerk Billing (see [`billing.md`](./billing.md) — don’t add a parallel billing stack unless explicitly requested)
- **Migrating off Clerk** — product decision only; see [`product.md`](./product.md). Don’t start a parallel authentication stack “for curiosity”
- **Role-based / fine-grained authorization** (organization admin vs member, board-level permissions, CASL/`permissions/` folder, Clerk `has({ role })` as product rules) — only when [`product.md`](./product.md) / [`features.md`](./features.md) call for it; until then don’t pretend we ship an Authorization feature
- Native mobile Clerk SDKs
- **Hand-rolled authentication** (custom crypto, home-grown OAuth, ad-hoc session cookies) — never the exit path from Clerk

## Why Clerk now (and what “later” means)

**Clerk** is the current **authentication provider** (ship-fast / Organizations). Product _why_, exit triggers, and “library not hand-roll” live in [`product.md`](./product.md) (**Authentication vs authentication provider**). This file is the integration + TODO map.

Until that product decision changes: deepen the current Clerk wiring ([TODOs](#todo--authentication) above); keep billing `orgId` coupling in [`billing.md`](./billing.md).
