# Features

What the app does **today**, and where to look in the codebase.

**Positioning / audience / domain terms:** [`product.md`](./product.md). **Word meanings** (feature, billing, pricing plan, organization, …): [`vocabulary.md`](./vocabulary.md). This file is only the shipped map — keep it honest as capabilities ship.

This repo is also a **learning reference** for the stack. Paths drift — use folders as a starting index; search the repo when in doubt. Catalog: [`README.md`](./README.md).

Canonical pricing-plan definitions: [`constants/pricing-plans.ts`](../constants/pricing-plans.ts). Product display name in app code: [`config/site.ts`](../config/site.ts) (`siteConfig.name`).

## Features

User-facing capabilities (shipped):

| Feature                        | What users get                                                                       | Start looking in                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing landing              | Public home / pitch                                                                  | `app/(marketing)/`                                                                                                                                  |
| Authentication                 | Sign-in, sign-up                                                                     | `app/(platform)/(clerk)/sign-in`, `…/sign-up`, `proxy.ts` — TODOs in [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| Organization selection         | Pick or create a Clerk organization (tenant)                                         | `app/(platform)/(clerk)/select-org`, `proxy.ts`                                                                                                     |
| Organization home / board list | Organization overview, list boards, create board (Unsplash picker, Free-plan limits) | `app/(platform)/(dashboard)/organization/[organizationId]/` (`page`, `_components/board-list/`, forms)                                              |
| Board canvas                   | Lists & cards on a board (incl. reorder / copy / delete flows)                       | `app/(platform)/(dashboard)/board/[boardId]/`, `actions/*-{board,list,card}*`                                                                       |
| Card detail                    | Card modal (title, description, activity)                                            | `components/modals/card-modal/`, `app/api/cards/[cardId]/`                                                                                          |
| Activity                       | Organization audit / activity feed                                                   | `…/organization/[organizationId]/activity/`, `AuditLog`, `lib/create-audit-log.ts`                                                                  |
| Organization settings          | Clerk organization profile UI                                                        | `…/organization/[organizationId]/settings/`                                                                                                         |
| Billing                        | Upgrade to **Pro**, manage subscription, gate capabilities by plan                   | `…/organization/[organizationId]/billing/`, [`billing.md`](./billing.md)                                                                            |
| Free-plan limits               | Cap boards on the **Free** plan; nudge toward **Pro**                                | `lib/organization-limit.ts`, `lib/subscription.ts`, create-board action, `FormPopover` (navbar + board tile), pro modal                             |

### Pricing plans (today)

Source of truth: [`constants/pricing-plans.ts`](../constants/pricing-plans.ts).

| Pricing plan | Kind    | Notes                                                                  |
| ------------ | ------- | ---------------------------------------------------------------------- |
| **Free**     | Default | No paid subscription required; board limits from `FREE_PLAN.maxBoards` |
| **Pro**      | Paid    | Monthly subscription; price / Stripe product fields from `PRO_PLAN`    |

**Board caps:** on each pricing plan, `maxBoards` is a positive integer ≥ 1 (capped) or `null` (unlimited). Pro uses `null` today — see [`constants/pricing-plans.ts`](../constants/pricing-plans.ts) (`hasUnlimitedBoards`).

More pricing plans are expected. Keep definitions in that module only. Named types there (`FreePlan`, `ProPlan`, …) + `satisfies` are the shape contract for each pricing-plan entry — useful now as documentation/checks, and as the base when you export a `Plan` union, narrow by `plan.id`, build plan lists/maps, or add another paid pricing plan. See the file header for the full growth notes.

## Shared plumbing (not features)

Code that supports the features above — shared building blocks, not rows in the Features table:

| Concern                  | Start looking in                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server mutations         | `actions/` (Zod + `create-safe-action`)                                                                                                                                                    |
| Thin authorization today | Session + active `orgId` + tenant-scoped queries + pricing-plan limits — see [`authentication-and-authorization.md`](./authentication-and-authorization.md) (not a Features-table row yet) |
| Data models / DB         | `prisma/`, `lib/prisma/`                                                                                                                                                                   |
| Shared UI / shadcn       | `components/` (`ui/` = shadcn only — see [`project-structure.md`](./project-structure.md))                                                                                                 |
| Dashboard shell          | `app/(platform)/(dashboard)/` (`Navbar`, sidebar, theme)                                                                                                                                   |

## Not shipped yet

| Item                                        | Notes                                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role-based / fine-grained **authorization** | Admin vs member, board-level permissions, etc. — out of scope in [`authentication-and-authorization.md`](./authentication-and-authorization.md) until product needs it |
| `app/(platform)/protected/`                 | Small authentication playground / experiment — do not treat as a shipped feature                                                                                       |

## Keeping this current

When you add or remove something users can do, update the Features table in the same change. Vision that is not shipped yet belongs in [`product.md`](./product.md), not here. Deep how-to for a concern stays in that concern’s doc ([docs index](./README.md)).
