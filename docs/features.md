# Features

What the app does **today**, and where to look in the codebase.

**Positioning / audience / domain terms:** [`product.md`](./product.md). **What “feature” means:** [`vocabulary.md`](./vocabulary.md). This file is only the shipped map — keep it honest as capabilities ship, and prefer extending what is listed here over inventing parallel paths.

This repo is also a **learning reference** for the Next.js / Clerk / Prisma / Stripe stack. Paths drift — use folders as a starting index; search the repo when in doubt. Catalog: [`README.md`](./README.md).

In prose, write **organization** (not “org”) and **authentication** (not “auth”). Keep Clerk names such as `orgId` and `auth()`.

**Plans vs billing:** **Billing** is the feature (subscriptions and one-off payments, webhooks, gating). **Free** and **Pro** are **pricing plans** (access tiers) — see [`vocabulary.md`](./vocabulary.md). Product display name in app code: [`config/site.ts`](../config/site.ts) (`siteConfig.name`). **Pro** is the paid pricing plan — do not use “Pro” to mean billing. Do not confuse **pricing plan** with a **project plan**.

Canonical pricing-plan definitions (limits, price, Stripe product strings): [`constants/pricing-plans.ts`](../constants/pricing-plans.ts).

## Features

User-facing capabilities (shipped):

| Feature | What users get | Start looking in |
| ------- | -------------- | ---------------- |
| Marketing landing | Public home / pitch | `app/(marketing)/` |
| Authentication | Sign-in, sign-up | `app/(platform)/(clerk)/sign-in`, `…/sign-up`, `proxy.ts` |
| Organization selection | Pick or create a Clerk organization (tenant) | `app/(platform)/(clerk)/select-org`, `proxy.ts` |
| Organization home / board list | Organization overview, list boards, create board (Unsplash picker, Free-plan limits) | `app/(platform)/(dashboard)/organization/[organizationId]/` (`page`, `_components/board-list`, forms) |
| Board canvas | Lists & cards on a board (incl. reorder / copy / delete flows) | `app/(platform)/(dashboard)/board/[boardId]/`, `actions/*-{board,list,card}*` |
| Card detail | Card modal (title, description, activity) | `components/modals/card-modal/`, `app/api/cards/[cardId]/` |
| Activity | Organization audit / activity feed | `…/organization/[organizationId]/activity/`, `AuditLog`, `lib/create-audit-log.ts` |
| Organization settings | Clerk organization profile UI | `…/organization/[organizationId]/settings/` |
| Billing | Upgrade to **Pro**, manage subscription, gate capabilities by plan | `…/organization/[organizationId]/billing/`, Stripe guide in the [docs index](./README.md) |
| Free-plan limits | Cap boards on the **Free** plan; nudge toward **Pro** | `lib/organization-limit.ts`, `lib/subscription.ts`, create-board action, pro modal / form popover |

### Pricing plans (today)

Source of truth: [`constants/pricing-plans.ts`](../constants/pricing-plans.ts).

| Pricing plan | Kind | Notes |
| ------------ | ---- | ----- |
| **Free** | Default | No paid subscription required; board limits from `FREE_PLAN.maxBoards` |
| **Pro** | Paid | Monthly subscription; price / Stripe product fields from `PRO_PLAN` |

**Board caps:** on each pricing plan, `maxBoards` is a number (capped) or `null` (unlimited). Pro uses `null` today — see [`constants/pricing-plans.ts`](../constants/pricing-plans.ts) (`hasUnlimitedBoards`).

More pricing plans are expected. Keep definitions in that module only. Named types there (`FreePlan`, `ProPlan`, …) + `satisfies` are the shape contract for each pricing-plan entry — useful now as documentation/checks, and as the base when you export a `Plan` union, narrow by `plan.id`, build plan lists/maps, or add another paid pricing plan. See the file header for the full growth notes.

## Shared plumbing (not features)

Code that supports the features above — shared building blocks, not rows in the Features table:

| Concern | Start looking in |
| ------- | ---------------- |
| Server mutations | `actions/` (Zod + `create-safe-action`) |
| Data models / DB | `prisma/`, `lib/prisma.ts` |
| Shared UI / shadcn | `components/` (`ui/` = shadcn only — see [`project-structure.md`](./project-structure.md)) |
| Dashboard shell | `app/(platform)/(dashboard)/` (`Navbar`, sidebar, theme) |

## Not shipped yet

| Item | Notes |
| ---- | ----- |
| `app/(platform)/protected/` | Small authentication playground / experiment — do not treat as a shipped feature |

## Keeping this current

When you add or remove something users can do, update the Features table in the same change. Vision that is not shipped yet belongs in [`product.md`](./product.md), not here. Deep billing behavior stays in the Stripe guide; stack “how we code” TODOs stay in the Next.js / Clerk / Prisma guides ([docs index](./README.md)).
