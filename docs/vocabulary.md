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

| Word                | Meaning                                                      |
| ------------------- | ------------------------------------------------------------ |
| **Product**         | The thing users use — this project management app as a whole |
| **App**             | Same thing, more technical angle — the running software      |
| **Repo / codebase** | The source code that makes the app                           |

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

These live _inside_ features. "Board canvas" is a feature; "board" is the object. "Card detail" is a feature; "card" is the object.

## Framework (two meanings)

| Context                                            | "Framework" means                                                  | Examples                            |
| -------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| Engineering ([`conventions.md`](./conventions.md)) | A **web/app framework** or language ecosystem                      | Next.js, React                      |
| Domain ([`product.md`](./product.md))              | A **project-management body of knowledge** tied to a certification | Scrum (PSM/PSPO), PMI (PMP/PMI-ACP) |

Always check which doc you're reading. When ambiguous, say "web framework" or "PM framework."

## Rule, recommendation, common practice, best practice

These words describe **how strongly something is required**. They work the same way on both sides (engineering and domain), but the _authorities_ are different.

| Word                  | What it means                                                                                 | What it does NOT mean                                     |
| --------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Rule / convention** | An authority **requires** it. You must follow it.                                             | Not "whatever most people do"                             |
| **Recommendation**    | An authority **encourages** it, but it's not a hard requirement                               | Not guaranteed to be the best outcome in every case       |
| **Common practice**   | What many people **actually do** — a widespread **habit**                                     | NOT the same as best practice. Common ≠ good.             |
| **Best practice**     | A **recommended better way** — we teach it in the product because it leads to better outcomes | NOT "what everyone already does" (that's common practice) |
| **Anti-pattern**      | A common or tempting approach that **causes problems**. We call it out and show a better way  | Not a banned-by-law rule                                  |

### The key distinction

> **Common practice** answers: "What do people usually do?"  
> **Best practice** answers: "What _should_ people do?"  
> These are often **different things**. That gap is where this product teaches.

### Who is the "authority"?

| Side        | Authority examples                                                         |
| ----------- | -------------------------------------------------------------------------- |
| Engineering | Next.js docs, React docs, TypeScript handbook, Prisma docs, Stripe docs    |
| Domain      | Scrum Guide (Scrum.org), PMBOK / PMI standards, official cert study guides |

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

| Word                        | Meaning                                                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Billing**                 | Umbrella **feature** — how customers pay and how paid access is granted/managed                                                                                                                                                                                           |
| **subscription**            | **Recurring** charge under billing (e.g. monthly Pro)                                                                                                                                                                                                                     |
| **one-off payment**         | **One-time** charge under billing (e.g. lifetime unlock, pack) — not a name for the whole billing feature                                                                                                                                                                 |
| **pricing plan**            | An **access / commercial tier** we sell or default to (Free, Pro, …): limits, price, entitlements. Source: [`constants/pricing-plans.ts`](../constants/pricing-plans.ts)                                                                                                  |
| **billing provider**        | External PSP that implements charging. **Stripe** is current; may be replaced or joined by others. Details: [`billing.md`](./billing.md)                                                                                                                                  |
| **authentication provider** | How we implement sign-in / sessions. **Clerk** is current (hosted). May later move to a **library we run** (e.g. Better Auth) — not hand-rolled crypto. See [`product.md`](./product.md) · [`authentication-and-authorization.md`](./authentication-and-authorization.md) |

**Billing** covers both **subscriptions** and **one-off payments**.  
**Pricing plans** are the tiers (Free / Pro). Charge shape (monthly vs one-time) is separate from the tier name.

### “Plan” vs project planning

In a project-management product, bare **plan** is easy to confuse with a **project plan** (PMI / everyday planning).

| Say                                              | When                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **pricing plan** (or **Free** / **Pro** by name) | Commercial tier, limits, upgrade — especially next to PM/domain copy                                                |
| **project plan** (or the cert term in use)       | Planning artifacts in the PM domain — only once those capabilities ship                                             |
| **plan** alone                                   | OK only when the billing / pricing context is already obvious (e.g. inside `billing.md` or the billing settings UI) |

Prefer **pricing plan** in docs and UI when a reader could mean either. Do **not** invent “billing plan” as a third label — use **pricing plan** + **subscription** or **one-off payment** for the charge shape.

Code keeps short identifiers (`FREE_PLAN`, `PRO_PLAN`, `PLANS`) in [`constants/pricing-plans.ts`](../constants/pricing-plans.ts); prose still follows the table above.

## Function-era pattern drift

**Repo term** for a real linguistic shift in modern React / Next.js (and this codebase): **functions dominate app and UI code**, so classic **class-era pattern names survive while their shapes get looser**.

We care about the **Hooks / App Router / function-component** era — not legacy class components. That stack still reuses words from Gang of Four (GoF) and older OOP teaching (**factory**, **builder**, adapter, …) because the **problems** are the same (hide creation, assemble config, wrap an API). What drifted is the **implementation shape**: GoF assumed classes, interfaces, and hierarchies; function-first code usually means a plain function, an object of functions, or a short fluent chain — **same intent, rarely the textbook UML**.

**One line:** The **word** stuck; the **class diagram** usually didn’t.

| Then (class / GoF teaching)                                          | Now (function-first React / this repo)                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Factory Method, Abstract Factory, Builder as **patterns with roles** | Same **names** for helpers that create or assemble values                        |
| Creator / Product class hierarchies, `new`, Directors                | `cardQueries.detail(id)`, `createStore(…)`, `paths.board(id)`, Zod/Prisma chains |
| Docs define the pattern, then show code                              | Docs often **never define** the word — they show a helper and move on            |

**How to read library and repo docs:**

1. Do **not** assume “factory” / “builder” means “we implemented the GoF pattern.”
2. Look at **what is returned** and **how you call it** (one-shot vs stepwise).
3. Treat GoF links as **ancestry / intent**, not a checklist for our TypeScript files.

**What did not die:** creational _intent_ still matters — co-locate creation, don’t reinvent keys/URLs/options in every call site. Examples we spell out: [Factory](#factory) · [Builder](#builder).

This is a **vocabulary** claim (how words behave), not a ban on classes in the language or in vendor SDKs.

### Also overloaded (triage — don’t essay everything)

Same drift / same “one English word, several jobs” risk. **Full write-ups** only when the confusion shows up often here (Factory, Builder). Everything else: a **one-line disambiguation** + link to the concern doc that already owns it.

| Word                         | Newbie trap                                                                                                                           | Where we settle it                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**                 | React `*Provider` (inject client into the tree) vs **billing / auth provider** (Stripe, Clerk as vendors) vs Nest-style DI “provider” | Billing/auth: [Billing terms](#billing-terms). React tree: [`client-ui-state.md`](./client-ui-state.md) (Providers ≠ Zustand UI flags)                                                       |
| **Action**                   | Redux/Flux “action” vs Zustand `open`/`close` vs Next **Server Action**                                                               | Flux/Zustand: [`client-ui-state.md`](./client-ui-state.md). Server Actions: [`data.md`](./data.md)                                                                                           |
| **Middleware**               | Next `proxy.ts` / request middleware vs Zustand `devtools` middleware vs Express middleware                                           | Zustand onion vs Next: [`client-ui-state.md`](./client-ui-state.md). Next proxy: [`nextjs.md`](./nextjs.md) · [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| **Proxy**                    | Next’s `proxy.ts` file vs GoF **Proxy** pattern                                                                                       | Next only here — [`nextjs.md`](./nextjs.md). Not the GoF pattern                                                                                                                             |
| **Store / selector / slice** | One Redux store + slices vs our **many small** Zustand stores + `select*`                                                             | [`client-ui-state.md`](./client-ui-state.md)                                                                                                                                                 |
| **Hook**                     | React `use*` Hook vs webhook vs editor “hooks”                                                                                        | React Hooks in app code; webhooks = HTTP callbacks ([`authentication-and-authorization.md`](./authentication-and-authorization.md) / billing). Not GoF                                       |
| **Service / repository**     | Nest-style layers vs our folders                                                                                                      | We **don’t** add parallel `services/`; DAL/DTO when needed — [`data.md`](./data.md) · [`project-structure.md`](./project-structure.md)                                                       |
| **Adapter**                  | GoF Adapter vs Prisma **driver adapter**                                                                                              | Only if you touch Prisma drivers — [`prisma.md`](./prisma.md) / installed Prisma docs. Not a React UI pattern here                                                                           |

**Promote to a full vocabulary section** (like Factory/Builder) only when (1) the word appears in many of our docs without a home, and (2) newbies keep mistaking it for GoF or for a different stack’s meaning. Until then, keep the table current and deepen the **concern** doc.

## Factory

**Factory** is everyday engineering jargon (not a TanStack/Next API name). Docs often use it without defining it — [function-era pattern drift](#function-era-pattern-drift): the word outlived the class shape.

A **factory** is a function (or small module of functions) that **creates and returns a configured value** — options, store hooks, mock exports — so callers don’t hand-build that value in many places.

|                          | **GoF Factory Method / Abstract Factory** | **“Factory” here / Query / Vitest**                             |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| **Shared**               | Hide _how_ something is built             | Same                                                            |
| **Shape**                | Classes, creators, polymorphic products   | Plain functions / object of functions returning data or options |
| **Do we implement GoF?** | —                                         | **No** — borrow the word and intent, not the class hierarchy    |

```ts
// lib/api/card.ts — colloquial resource factory
export const cardQueries = {
  all: () => ["card"] as const,
  byId: (id: string | undefined) => [...cardQueries.all(), id] as const,
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.byId(id), "detail"] as const,
      queryFn: () => fetcher<CardWithList>(`/api/cards/${id}`),
      enabled: !!id,
    }),
};

useQuery(cardQueries.detail(id));
```

**Rule of thumb:** UML with `Creator` / `ConcreteProduct` → GoF. `cardQueries.detail(id)` or `vi.mock("…", () => ({ … }))` → **colloquial** factory. Saying it “builds” a value in ordinary English is **not** the [Builder](#builder) pattern.

| We say                       | What it is                                                           | Where                                                                            |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Resource / Query factory** | `cardQueries`-style module: `queryKey` + `queryOptions`              | [`lib/api/card.ts`](../lib/api/card.ts) · why/layout: [`data.md`](./data.md)     |
| **Store factory**            | [`createStore`](../lib/create-store.ts) — sole Zustand import        | [`client-ui-state.md`](./client-ui-state.md)                                     |
| **`vi.mock` factory**        | Callback that supplies mocked exports                                | [`testing.md`](./testing.md) · [vi.mock](https://vitest.dev/api/vi.html#vi-mock) |
| **`factories/` (folder)**    | Optional **test data builders** (fixtures) — see [Builder](#builder) | [`project-structure.md`](./project-structure.md)                                 |

Official Query helper is [`queryOptions`](https://tanstack.com/query/v5/docs/framework/react/guides/query-options) (no glossary “factory”). Community “query key factory” usually means key helpers only; our resource factories add `queryFn` too — details: [`data.md`](./data.md).

## Builder

**Builder** is everyday jargon and, separately, a GoF pattern. Docs mix “builds a path,” fluent `.foo().bar().build()`, and GoF — same [function-era pattern drift](#function-era-pattern-drift) as [Factory](#factory).

A **builder** assembles a value **in steps** (or looks like it): chain options, then produce the finished object. People also say “path builder” for a one-shot helper with **no** `.build()` and **no** GoF structure.

|                          | **GoF Builder**                                              | **“Builder” in many JS/TS libs**                           |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| **Shared**               | Assemble something complex without a telescoping constructor | Same impulse                                               |
| **Shape**                | Builder + Product (+ Director); often `build()`              | Fluent chain, or a plain helper named “builder”            |
| **Do we implement GoF?** | —                                                            | **Almost never** — use library fluent APIs or tiny helpers |

```ts
// Colloquial “path builder” — not GoF
export const paths = {
  board: (boardId: string) => route(`/board/${boardId}`),
};
```

Vendor fluent APIs (Prisma `findMany` chains, Zod `.trim().min(3)`) are **shaped like** builders; consume them via [Match installed official docs](#match-installed-official-docs) — don’t invent a parallel `BoardBuilder` unless stepwise domain construction really hurts.

### Factory vs Builder

| Lead with…  | When the hard part is…                            | Example                                    |
| ----------- | ------------------------------------------------- | ------------------------------------------ |
| **Factory** | **Which** thing / one-shot correct config         | `cardQueries.detail(id)`, `createStore(…)` |
| **Builder** | **How** to assemble many optional / ordered parts | Fluent chains, rich test fixtures          |

In **this repo’s docs**, prefer **factory** for `lib/api/*`, `createStore`, `vi.mock` factories; **builder** for fluent/stepwise assembly, “path builder” prose, and `factories/` fixture helpers. If someone says “builder” but means `cardQueries`, they mean [Factory](#factory).

| We say                                | What it is                       | GoF Builder?                                        |
| ------------------------------------- | -------------------------------- | --------------------------------------------------- |
| **Path builders / `paths.*`**         | Functions returning typed routes | No — colloquial                                     |
| **Test data builders** (`factories/`) | Fixture helpers                  | Sometimes fluent; often `makeCard({ … })`           |
| **Prisma / Zod chains**               | Library fluent APIs              | Vendor ≈ builder; we consume                        |
| Homegrown `FooBuilder` classes        | —                                | **Avoid** unless domain needs stepwise construction |

## Match installed official docs

**Hard engineering rule:** when using a library/framework API, read official docs for the **version installed** in this repo (`package.json` / `node_modules/<pkg>/package.json`) — not training data, not “whatever is latest on the marketing site,” not a random blog.

Full procedure + per-package how-to: [`conventions.md` → Match installed official docs](./conventions.md#match-installed-official-docs). Agents: [`AGENTS.md`](../AGENTS.md).

## One tool per job

**Hard engineering rule** for this repo (not a soft “common practice”):

1. **Choose carefully** which library/framework fills a purpose.
2. **Never run two tools for the same purpose** (no parallel stacks: Jest+Vitest, Cypress+Playwright, SWR+Query, Lodash+es-toolkit, …).
3. **Replace** the adopted tool only if the candidate can do **everything (or nearly everything) it does for that purpose, and better**. A niche win is not enough.

**Why replace (when the dominates bar is met):** capability gap, maintenance/longevity, operational cost for this app, stack fit, risk/compliance, or real team/platform leverage — not popularity or fashion. Full table + “not enough”: [`conventions.md` → When a replacement is justified](./conventions.md#when-a-replacement-is-justified).

Full wording + examples: [`conventions.md` → One tool per job](./conventions.md#one-tool-per-job). Agents: [`AGENTS.md`](../AGENTS.md).

## Other terms

| Word                               | Where defined                                                                             | Quick meaning                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Match installed official docs**  | [Match installed official docs](#match-installed-official-docs) above                     | Use version-correct official docs for every dependency. SoT: [`conventions.md`](./conventions.md#match-installed-official-docs) · [`AGENTS.md`](../AGENTS.md)                                                                                                                                                                                 |
| **One tool per job**               | [One tool per job](#one-tool-per-job) above                                               | Choose carefully; no parallel stack for the same purpose; replace only if the other tool dominates. Hard rule: [`conventions.md`](./conventions.md#one-tool-per-job) · [`AGENTS.md`](../AGENTS.md)                                                                                                                                            |
| **billing** / **pricing plan** / … | [Billing terms](#billing-terms) above                                                     | Do not confuse pricing plans with project plans. Flows: [`billing.md`](./billing.md)                                                                                                                                                                                                                                                          |
| **Function-era pattern drift**     | [Function-era pattern drift](#function-era-pattern-drift) above                           | In modern React/Next (functions dominate), GoF **names** stay while **shapes** loosen — intent without the class diagram. Frames [Factory](#factory) / [Builder](#builder).                                                                                                                                                                   |
| **Factory**                        | [Factory](#factory) above                                                                 | One-shot creation helper (colloquial). Related to GoF Factory **in intent only**. Not the [Builder](#builder) pattern. Official Query helper: [`queryOptions`](https://tanstack.com/query/v5/docs/framework/react/guides/query-options). [`data.md`](./data.md) · [`client-ui-state.md`](./client-ui-state.md) · [`testing.md`](./testing.md) |
| **Builder**                        | [Builder](#builder) above                                                                 | Stepwise / fluent assembly (or everyday “path/query/fixture builder”). Related to GoF Builder **in intent only**. Distinct from [Factory](#factory). [`nextjs.md`](./nextjs.md) (`paths`) · Prisma/Zod chains                                                                                                                                 |
| **Organization**                   | Clerk concept, used throughout                                                            | A tenant / team workspace. Write **organization** in prose, keep `orgId` in code                                                                                                                                                                                                                                                              |
| **Authentication**                 | Sign-in / session identity                                                                | Write **authentication** in prose — do not abbreviate. Keep Clerk identifiers such as `auth()`, `useAuth`. Doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md)                                                                                                                                                |
| **Authorization**                  | Whether an identity may do a specific action or see a resource                            | Write **authorization** in prose — do not abbreviate. Different from authentication. Same doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md)                                                                                                                                                                 |
| **Cache**                          | Overloaded — Redis/CDN vs Next framework caching vs TanStack Query                        | Disambiguate in [`data.md`](./data.md#cache-means-different-things-traditional-be-vs-next-vs-client). Do not invent a separate cache doc                                                                                                                                                                                                      |
| **DAL** (Data Access Layer)        | Server module(s) that control **how/when** data is read/mutated and run **authorization** | Not a Next API — a pattern. Solid explanation + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only). Next snippets: [Data Security](https://nextjs.org/docs/app/guides/data-security#data-access-layer), [Authentication](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal)                          |
| **DTO** (Data Transfer Object)     | Safe, minimal return shape across a boundary (not a raw DB row)                           | Produced by a DAL. Same idea as NestJS response DTOs. Teach + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only)                                                                                                                                                                                                                      |
| **Test name** (Vitest)             | String identifying a **`test`** (first argument to `test`)                                | Not “test title.” Not the suite name (`describe`’s first argument). Terms + naming: [`testing.md`](./testing.md)                                                                                                                                                                                                                              |
| **Stub** (Vitest / testing)        | Minimal fake so code under test can run; usually not asserted on                          | Distinct from **mock** (assert calls) and **spy** (`vi.spyOn`). Glossary: [`testing.md`](./testing.md)                                                                                                                                                                                                                                        |
| **Repo convention**                | [`conventions.md`](./conventions.md)                                                      | A rare rule this repo invents when no higher authority covers it                                                                                                                                                                                                                                                                              |
| **Product choice**                 | [`product.md`](./product.md)                                                              | UX/copy we invent when no higher domain authority decides                                                                                                                                                                                                                                                                                     |

## Keeping this current

If you rename or redefine any of these words, update **this file first**, then the docs that use them.
