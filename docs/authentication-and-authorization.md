# Authentication and authorization

Learning reference for **authentication** and **authorization** in this app. **Clerk** is the current **authentication provider** (plus Organizations); it may be replaced later — the concern names stay. Prefer [Clerk docs](https://clerk.com/docs) for the SDK version in `package.json`. Repo Clerk skills under `.claude/skills/clerk*` can help with setup, Organizations, and Next.js patterns.

Index of all project docs: [`README.md`](./README.md). **Billing** is keyed by Clerk `orgId` — see [`billing.md`](./billing.md) when changing Checkout metadata / webhooks. Product framing (why Clerk now, exit options later): [`product.md`](./product.md) (**Authentication vs authentication provider**).

In prose, write **authentication**, **authorization**, and **organization** in full (do not abbreviate). Keep Clerk identifiers such as `auth()`, `useAuth`, and `orgId`.

## Why Clerk now (and what “later” means)

| | Hosted (Clerk today) | Library in our stack (likely exit) |
| - | -------------------- | ---------------------------------- |
| Goal | Ship authentication + Organizations **fast** | Own users/sessions in **our** DB; predictable cost |
| Tradeoff | Per-MAU / plan pricing; user data on vendor infra | More setup; build more UI yourself; you operate security |
| Do **not** | Treat Clerk as identity forever by default | Hand-roll password hashing, OAuth, session cookies |

**Better Auth** ([docs](https://www.better-auth.com/docs), [Next.js integration](https://www.better-auth.com/docs/integrations/next)) is the common 2026 library choice for “Clerk-like features, self-hosted”: TypeScript-first, Prisma-friendly, organizations/plugins, and the path Auth.js points **new** projects toward after the Auth.js → Better Auth handoff. That does **not** mean migrate this week — only that “stop paying Clerk” should mean **adopt a maintained library**, not write authentication from scratch.

**Triggers to evaluate leaving Clerk** (any strong signal): MAU pricing ≫ value; compliance / data-residency needs Clerk can’t meet at our tier; we need auth behavior Clerk fights. Until then, deepen the current integration ([TODOs](#todo--authentication) below) and keep Stripe `orgId` coupling documented.

**If we migrate:** treat it like a second billing provider — one explicit decision, adapter-ish boundaries where possible, update [`features.md`](./features.md) / this doc / Stripe `orgId` notes in the **same** change. Don’t run Clerk and Better Auth in parallel as two sources of truth.

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

These are **gaps in today’s thin model**, not a greenfield RBAC feature. Next.js-shaped checklist also lives in [`nextjs.md`](./nextjs.md) — close both when done.

- [ ] **Every Server Action / protected Route Handler** verifies authentication (`userId`), active organization (`orgId`), and **resource ownership** (row belongs to that `orgId`) — assume actions are POSTable directly ([Data security](https://nextjs.org/docs/app/guides/data-security))
- [ ] **Audit coverage** — spot-check actions/APIs that might only check `userId`/`orgId` without scoping the Prisma `where` to the organization
- [ ] **HTTP meaning** — prefer clear failure shapes: unauthenticated vs not allowed (today many paths return the string `"Unauthorized"` for both; don’t invent a house protocol, but don’t blur the two ideas in new code)
- [ ] **Keep `proxy.ts` optimistic only** — session/organization gating in the proxy; full authorization stays in pages, layouts, and actions (shared with [`nextjs.md`](./nextjs.md))

When closing a TODO, update this list; add a one-line note under **Already following** if it teaches a lasting pattern.

## Out of scope for now (not TODOs)

- Replacing Stripe **billing** with Clerk Billing (see [`billing.md`](./billing.md) — don’t add a parallel billing stack unless explicitly requested)
- **Migrating off Clerk** to Better Auth (or similar) — product decision only; see [Why Clerk now](#why-clerk-now-and-what-later-means). Don’t start a parallel authentication stack “for curiosity”
- **Role-based / fine-grained authorization** (organization admin vs member, board-level permissions, CASL/`permissions/` folder, Clerk `has({ role })` as product rules) — only when [`product.md`](./product.md) / [`features.md`](./features.md) call for it; until then don’t pretend we ship an Authorization feature
- Native mobile Clerk SDKs
- **Hand-rolled authentication** (custom crypto, home-grown OAuth, ad-hoc session cookies) — never the exit path from Clerk