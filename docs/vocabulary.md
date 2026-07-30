# Vocabulary

Plain definitions for words used across this repo's docs.  
Read this **first** — other docs assume you know these.

Catalog: [`README.md`](./README.md).

## The big picture

This app is a **project management product**. It has two sides:

1. **The software itself** — code, UI, infrastructure (what engineers build)
2. **The domain** — project management knowledge from certifications like PSM, PMP, PMI-ACP, etc. (what the product teaches and enforces for users)

We use **different words** for each side, and some words appear on both sides with **different meanings**. This page exists so the team doesn't mix them up.

## Product and app

| Word | Meaning |
| ---- | ------- |
| **Product** | The thing users use — this project management app as a whole |
| **App** | Same thing, more technical angle — the running software |
| **Repo / codebase** | The source code that makes the app |

These are not three separate things. They're three ways of talking about the same thing depending on context.

## Feature

**Feature = something users can do in the shipped app.**

Examples: sign in, create a board, upgrade to Pro, view activity.

In [`features.md`](./features.md), the Features table is a map of **what the app can do today** and **where to find it in code**. That's all it means.

**"Feature" in some Agile / scaling materials** (SAFe, etc.) can mean a backlog item between epic and story. That is a **different use of the same word**. We do not use it that way in our docs. If the product later ships backlog management with that concept, label the origin and don't overload `features.md`.

## Board, list, card

These are **domain objects in the app's UI** — the things users interact with to manage their work.

- **Board** — a workspace for a project or topic
- **List** — a column on a board (e.g. "To Do", "In Progress", "Done")
- **Card** — a work item on a list

These live *inside* features. "Board canvas" is a feature; "board" is the object. "Card detail" is a feature; "card" is the object.

## Framework (two meanings)

| Context | "Framework" means | Examples |
| ------- | ----------------- | -------- |
| Engineering ([`conventions.md`](./conventions.md)) | A **web/app framework** or language ecosystem | Next.js, React |
| Domain ([`product.md`](./product.md)) | A **project-management body of knowledge** tied to a certification | Scrum (PSM/PSPO), PMI (PMP/PMI-ACP) |

Always check which doc you're reading. When ambiguous, say "web framework" or "PM framework."

## Rule, recommendation, common practice, best practice

These words describe **how strongly something is required**. They work the same way on both sides (engineering and domain), but the *authorities* are different.

| Word | What it means | What it does NOT mean |
| ---- | ------------- | --------------------- |
| **Rule / convention** | An authority **requires** it. You must follow it. | Not "whatever most people do" |
| **Recommendation** | An authority **encourages** it, but it's not a hard requirement | Not guaranteed to be the best outcome in every case |
| **Common practice** | What many people **actually do** — a widespread **habit** | NOT the same as best practice. Common ≠ good. |
| **Best practice** | A **recommended better way** — we teach it in the product because it leads to better outcomes | NOT "what everyone already does" (that's common practice) |
| **Anti-pattern** | A common or tempting approach that **causes problems**. We call it out and show a better way | Not a banned-by-law rule |

### The key distinction

> **Common practice** answers: "What do people usually do?"  
> **Best practice** answers: "What *should* people do?"  
> These are often **different things**. That gap is where this product teaches.

### Who is the "authority"?

| Side | Authority examples |
| ---- | ------------------ |
| Engineering | Next.js docs, React docs, TypeScript handbook, Prisma docs, Stripe docs |
| Domain | Scrum Guide (Scrum.org), PMBOK / PMI standards, official cert study guides |

For engineering, living catalogs of common practice (with status + source links) are:

- Code / naming / workflow → [`conventions.md` → Common practices catalog](./conventions.md#common-practices-catalog)
- Folders → [`project-structure.md` → Common practice folders](./project-structure.md#common-practice-folders)

Those lists are **habits + evidence**, not a sealed cross-framework registry.

## Priority list

Both [`conventions.md`](./conventions.md) and [`product.md`](./product.md) have an **ordered list** where higher rows win when two ideas disagree.

- Engineering priority list: rule → recommendation → common practice → repo convention
- Domain priority list: framework rule → framework recommendation → common practice → best practice → product choice

These are **separate lists** for **separate decisions**. Don't mix them.

## Billing terms

| Word | Meaning |
| ---- | ------- |
| **Billing** | Umbrella **feature** — how customers pay and how paid access is granted/managed |
| **subscription** | **Recurring** charge under billing (e.g. monthly Pro) |
| **one-off payment** | **One-time** charge under billing (e.g. lifetime unlock, pack) — not a name for the whole billing feature |
| **pricing plan** | An **access / commercial tier** we sell or default to (Free, Pro, …): limits, price, entitlements. Source: [`constants/pricing-plans.ts`](../constants/pricing-plans.ts) |
| **billing provider** | External PSP that implements charging. **Stripe** is current; may be replaced or joined by others. Details: [`billing.md`](./billing.md) |
| **authentication provider** | How we implement sign-in / sessions. **Clerk** is current (hosted). May later move to a **library we run** (e.g. Better Auth) — not hand-rolled crypto. See [`product.md`](./product.md) · [`authentication-and-authorization.md`](./authentication-and-authorization.md) |

**Billing** covers both **subscriptions** and **one-off payments**.  
**Pricing plans** are the tiers (Free / Pro). Charge shape (monthly vs one-time) is separate from the tier name.

### “Plan” vs project planning

In a project-management product, bare **plan** is easy to confuse with a **project plan** (PMI / everyday planning).

| Say | When |
| --- | ---- |
| **pricing plan** (or **Free** / **Pro** by name) | Commercial tier, limits, upgrade — especially next to PM/domain copy |
| **project plan** (or the cert term in use) | Planning artifacts in the PM domain — only once those capabilities ship |
| **plan** alone | OK only when the billing / pricing context is already obvious (e.g. inside `billing.md` or the billing settings UI) |

Prefer **pricing plan** in docs and UI when a reader could mean either. Do **not** invent “billing plan” as a third label — use **pricing plan** + **subscription** or **one-off payment** for the charge shape.

Code keeps short identifiers (`FREE_PLAN`, `PRO_PLAN`, `PLANS`) in [`constants/pricing-plans.ts`](../constants/pricing-plans.ts); prose still follows the table above.

## Other terms

| Word | Where defined | Quick meaning |
| ---- | ------------- | ------------- |
| **Billing** / **pricing plan** / … | [Billing terms](#billing-terms) above | Do not confuse pricing plans with project plans |
| **Organization** | Clerk concept, used throughout | A tenant / team workspace. Write **organization** in prose, keep `orgId` in code |
| **Authentication** | Sign-in / session identity | Write **authentication** in prose — do not abbreviate. Keep Clerk identifiers such as `auth()`, `useAuth`. Doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| **Authorization** | Whether an identity may do a specific action or see a resource | Write **authorization** in prose — do not abbreviate. Different from authentication. Same doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| **Cache** | Overloaded — Redis/CDN vs Next framework caching vs TanStack Query | Disambiguate in [`data.md`](./data.md#cache-means-different-things-traditional-be-vs-next-vs-client). Do not invent a separate cache doc |
| **DAL** (Data Access Layer) | Server module(s) that control **how/when** data is read/mutated and run **authorization** | Not a Next API — a pattern. Solid explanation + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only). Next snippets: [Data Security](https://nextjs.org/docs/app/guides/data-security#data-access-layer), [Authentication](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal) |
| **DTO** (Data Transfer Object) | Safe, minimal return shape across a boundary (not a raw DB row) | Produced by a DAL. Same idea as NestJS response DTOs. Teach + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only) |
| **Repo convention** | [`conventions.md`](./conventions.md) | A rare rule this repo invents when no higher authority covers it |
| **Product choice** | [`product.md`](./product.md) | UX/copy we invent when no higher domain authority decides |

## Keeping this current

If you rename or redefine any of these words, update **this file first**, then the docs that use them.
