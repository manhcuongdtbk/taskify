# Product

Who this product is for, where it’s going, and how we choose **domain** rules and names.  
**Shipped capabilities** (what exists in the app today): [`features.md`](./features.md).  
**Engineering** pattern priority (Next.js, libraries, languages): [`conventions.md`](./conventions.md).  
**Shared definitions** (common practice vs best practice, …): [`vocabulary.md`](./vocabulary.md).  
Docs catalog: [`README.md`](./README.md).

Product display name in app code: [`config/site.ts`](../config/site.ts) (`siteConfig.name`).

These two priority lists are separate on purpose: code decisions use [`conventions.md`](./conventions.md); project-management / cert decisions use **this** page. Do not merge them.

## In one sentence

An organization-based project management product that helps people **practice and learn** project work the way recognized certifications teach it — not only a generic board tool.

## Audience

People who are **preparing for** or **already hold** credentials such as:

- **PSM** / **PSPO** (Scrum.org)
- **PMP** / **PMI-ACP** (PMI)
- Related certificates as we add coverage

The team will **dogfood** the product for real project work while growing features toward that audience.

## What we aim to offer

Beyond boards / lists / cards (the current base — see [`features.md`](./features.md)):

- Manage projects using each framework’s **way of doing things** (see priority list below)
- Surface **best practices** and **anti-patterns** in context (definitions: [`vocabulary.md`](./vocabulary.md))
- Support both **doing the work** and **understanding why** (practice + learning)

Today the codebase is still primarily a board-style foundation plus billing. Treat the bullets above as the **direction**, not as shipped features, until they appear in [`features.md`](./features.md).

## Billing vs billing provider

- **Billing** is the product feature (subscriptions, one-off payments, plan gating) — see [`features.md`](./features.md).
- **Stripe** is the current **billing provider** (PSP). Chosen for docs, tutorials, and speed of integration — not because billing *is* Stripe.
- Provider limits (e.g. regional / payment-method coverage such as Vietnam) may later mean replacing Stripe or supporting **more than one** provider. Product language stays **billing** / **pricing plans**; integration details stay in [`stripe.md`](./stripe.md) until a second provider exists.
- **Pricing plan** (Free / Pro) ≠ **project plan** — see [`vocabulary.md`](./vocabulary.md).

## Domain priority (highest first)

**Read [`vocabulary.md`](./vocabulary.md) first** — especially **common practice ≠ best practice**.

When two domain ideas disagree, use the highest row that **owns** the decision. Expand this list only as cert-specific features ship.

| Priority | Kind | Meaning |
| -------- | ---- | ------- |
| 1 | **Framework rule** | Official source **requires** it (e.g. Scrum Guide, PMI / PMBOK standards) |
| 2 | **Framework recommendation** | Official source **encourages** it, but does not hard-require it |
| 3 | **Common practice** | Widespread habit in industry / across frameworks — not the same as best practice |
| 4 | **Best practice** | What **we teach** in the product (better approaches, anti-pattern callouts, exam vs workplace) |
| 5 | **Product choice** | UX/copy we invent only when the rows above don’t decide |

**“Framework’s way”** = rows 1–2 first (what the cert’s authorities expect), then row 3 (how people often work). Row 4 teaches; it must **not** silently override rows 1–2.

Prefer the **current official** guide/standard for the framework in play over blog posts or memory.

## When frameworks disagree

Scrum ≠ PMI (and other pairs). Do not mash them into one silent hybrid.

- Prefer a clear **context / mode** (e.g. Scrum-oriented vs PMI-oriented workspace or project) so in-product rules stay coherent.
- Where learning needs both views, **show both and label the origin**.
- Vocabulary and behaviors follow the active mode’s priority list above.

## How we use domain terms (cert vocabulary)

Audience members already study formal vocabulary (Sprint, backlog, …). Use it carefully:

1. **Use a framework term** when that concept exists in the product and the audience benefits from the standard name — only once we ship them.
2. **Name the origin** when frameworks collide or overlap.
3. **Don’t invent a house synonym** for a standard term this audience already knows.
4. **Don’t dump unused glossary words** before the capability ships — vocabulary follows features, not the other way around.
5. **Plain words are fine** for UI chrome and engineering docs when no cert concept is in play (e.g. “board”, “billing”, “organization”).

Meta-words like *common practice* / *best practice* are defined in [`vocabulary.md`](./vocabulary.md), not here.

## Keeping this current

When audience, positioning, or domain priority change, update this file in the same change. When shared kind names change, update [`vocabulary.md`](./vocabulary.md) first. When a vision item ships, add it to [`features.md`](./features.md).
