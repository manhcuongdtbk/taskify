# Taskify features

What the product does today, and where to look in the codebase.

This repo is a **learning reference** for the Next.js / Clerk / Prisma / Stripe stack **and** a **solid foundation for a real product**. Treat this map as the product surface area: keep it honest as features ship, and prefer extending these areas over inventing parallel ones.

Paths drift — use folders as a starting index; search the repo when in doubt. Catalog: [`README.md`](./README.md).

In prose, write **organization** (not “org”). The identifier `orgId` is the exception — that name comes from Clerk.

**Plans vs billing:** **Billing** is the product feature (upgrade, manage subscription, webhooks, plan gating). **Free** and **Pro** are **plans**. Product display name in app code: [`config/site.ts`](../config/site.ts) (`siteConfig.name`). **Pro** is the paid plan — do not use “Pro” to mean the billing feature itself.

Canonical plan definitions (limits, price, Stripe product strings): [`constants/plans.ts`](../constants/plans.ts).

## Product areas

| Area | What users get | Start looking in |
| ---- | -------------- | ---------------- |
| Marketing landing | Public home / pitch | `app/(marketing)/` |
| Auth | Sign-in, sign-up | `app/(platform)/(clerk)/sign-in`, `…/sign-up`, `proxy.ts` |
| Organization selection | Pick or create a Clerk organization (tenant) | `app/(platform)/(clerk)/select-org`, `proxy.ts` |
| Organization home / board list | Organization overview, list boards, create board (Unsplash picker, Free-plan limits) | `app/(platform)/(dashboard)/organization/[organizationId]/` (`page`, `_components/board-list`, forms) |
| Board canvas | Lists & cards on a board (incl. reorder / copy / delete flows) | `app/(platform)/(dashboard)/board/[boardId]/`, `actions/*-{board,list,card}*` |
| Card detail | Card modal (title, description, activity) | `components/modals/card-modal/`, `app/api/cards/[cardId]/` |
| Activity | Organization audit / activity feed | `…/organization/[organizationId]/activity/`, `AuditLog`, `lib/create-audit-log.ts` |
| Organization settings | Clerk organization profile UI | `…/organization/[organizationId]/settings/` |
| Billing | Upgrade to **Pro**, manage subscription, gate features by plan | `…/organization/[organizationId]/billing/`, Stripe guide in the [docs index](./README.md) |
| Free-plan limits | Cap boards on the **Free** plan; nudge toward **Pro** | `lib/organization-limit.ts`, `lib/subscription.ts`, create-board action, pro modal / form popover |

### Plans (today)

Source of truth: [`constants/plans.ts`](../constants/plans.ts).

| Plan | Kind | Notes |
| ---- | ---- | ----- |
| **Free** | Default | No Stripe subscription required; board limits from `FREE_PLAN.maxBoards` |
| **Pro** | Paid | Monthly subscription; price / Stripe product fields from `PRO_PLAN` |

**Board caps:** on each plan, `maxBoards` is a number (capped) or `null` (unlimited). Pro uses `null` today — see [`constants/plans.ts`](../constants/plans.ts) (`hasUnlimitedBoards`).

More plans are expected. Keep definitions in that module only. Named types there (`FreePlan`, `ProPlan`, …) + `satisfies` are the shape contract for each plan entry — useful now as documentation/checks, and as the base when you export a `Plan` union, narrow by `plan.id`, build plan lists/maps, or add another paid plan. See the file header for the full growth notes.

## Cross-cutting (not separate products)

These support the areas above; they are part of the foundation, not standalone features:

| Concern | Start looking in |
| ------- | ---------------- |
| Server mutations | `actions/` (Zod + `create-safe-action`) |
| Data models / DB | `prisma/`, `lib/prisma.ts` |
| Shared UI / shadcn | `components/` (`ui/` = shadcn only — see [`project-structure.md`](./project-structure.md)) |
| Dashboard shell | `app/(platform)/(dashboard)/` (`Navbar`, sidebar, theme) |

## Not product surface (yet)

| Item | Notes |
| ---- | ----- |
| `app/(platform)/protected/` | Small auth playground / experiment — do not treat as a shipped feature unless productized |

## Keeping this current

When you add or remove user-visible capability, update this table in the same change. Deep billing behavior stays in the Stripe guide; stack “how we code” TODOs stay in the Next.js / Clerk / Prisma guides ([docs index](./README.md)).
