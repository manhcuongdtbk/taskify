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

**Factory** is everyday engineering jargon, not a TanStack- or Next-specific API. Docs (ours and many libraries’) often say “factory” without a glossary entry because they assume the common meaning. That vagueness is [function-era pattern drift](#function-era-pattern-drift): the word outlived the class shape.

### What it means

A **factory** is a function (or small module of functions) whose job is to **create and return a configured value** — options objects, store instances, mocks, test fixtures — instead of callers hand-building that value in many places.

**Why bother:** one place owns shape and defaults; call sites stay short; keys / types / middleware stay consistent when something changes.

**Not the same as:** a React component (renders UI), a Route Handler (serves HTTP), or a Zod schema (validates). A factory **produces** configuration or instances those other pieces **consume**.

### Relation to the GoF “Factory” patterns

**Yes, related — same English idea, different strictness.**

The Gang of Four (GoF) [Factory Method](https://refactoring.guru/design-patterns/factory-method) and [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory) patterns also exist to **centralize creation**: callers ask for a product and do not know (or care) which concrete class was constructed.

|                          | **GoF Factory Method / Abstract Factory**                                      | **“Factory” in this repo / Query / Vitest**                                      |
| ------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Shared**               | Hide _how_ something is built; one place to change creation                    | Same                                                                             |
| **Typical shape**        | Classes, creator interfaces, polymorphic products, often `new` behind a method | Plain functions or an object of functions that **return data / options / hooks** |
| **Goal emphasis**        | Swap implementations without changing callers (plugin-style OO)                | Reuse one correct config (keys, `queryFn`, DevTools wiring, mock exports)        |
| **Do we implement GoF?** | —                                                                              | **No.** We borrow the _word_ and the _intent_, not the class hierarchy           |

#### Side by side (same “hide creation” idea)

**GoF-style Factory Method** (illustrative only — not used in this repo). Caller depends on an abstract product; a creator subclass picks the concrete class:

```ts
interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(message: string) {
    /* SMTP… */
  }
}

class SmsNotifier implements Notifier {
  send(message: string) {
    /* SMS gateway… */
  }
}

/** Creator — subclasses decide which Notifier to `new` */
abstract class AlertService {
  abstract createNotifier(): Notifier; // ← Factory Method

  notify(message: string) {
    this.createNotifier().send(message);
  }
}

class EmailAlertService extends AlertService {
  createNotifier() {
    return new EmailNotifier(); // swap SmsNotifier here without changing notify()
  }
}

new EmailAlertService().notify("Board archived");
```

What matters in GoF: **polymorphic products** + **creator hierarchy** so you can ship a different `Notifier` without editing `notify`.

**Colloquial factory in this repo** — no classes, no `new`, no swap-the-implementation hierarchy. A function builds a **config object** callers pass to Query:

```ts
// lib/api/card.ts
export const cardQueries = {
  all: () => ["card"] as const,
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: [...cardQueries.all(), id] as const,
      queryFn: () => fetcher<CardWithList>(`/api/cards/${id}`),
      enabled: !!id,
    }),
};

// callers — they never hand-roll the key or URL
useQuery(cardQueries.detail(id));
queryClient.invalidateQueries({ queryKey: cardQueries.detail(id).queryKey });
```

| Question                       | GoF example above                                    | `cardQueries`                                                 |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------- |
| What is created?               | A **runtime object** (`EmailNotifier`) with behavior | A **plain options value** (`{ queryKey, queryFn, enabled }`)  |
| Why hide creation?             | Swap email vs SMS behind `createNotifier()`          | One correct key + URL everywhere (modal, invalidation, tests) |
| Inheritance / interfaces?      | Yes                                                  | No                                                            |
| Is this “the Factory pattern”? | Yes (Factory Method sketch)                          | **No** — only the everyday word “factory”                     |

**Rule of thumb:** UML with `Creator` / `ConcreteProduct` → GoF. `cardQueries.detail(id)` or `vi.mock("…", () => ({ … }))` → **colloquial** factory. (We may say it “builds” a value in ordinary English — that is **not** the [Builder](#builder) pattern.)

Do **not** read our docs as “we adopted the Factory design pattern.” Read them as “this module **builds** the thing callers reuse.”

### Why library docs feel vague

Authors reuse “factory” as a **habit name** for co-located creation helpers. They show an example and move on. That is especially true for TanStack Query:

| Source                                                                                                                         | Does it define “factory”?                             | What it actually teaches                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Official [Query Options](https://tanstack.com/query/v5/docs/framework/react/guides/query-options) (v5 — match installed major) | **No** glossary term                                  | A helper like `groupOptions(id)` that returns `queryOptions({ queryKey, queryFn, … })` for reuse with `useQuery` / prefetch / etc. |
| Official [Query Keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)                                    | Mentions community **Query Key Factory** package only | How keys work; points out for larger apps                                                                                          |
| [TkDodo — Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)                                       | Yes, as a **pattern name**                            | Object of functions that **produce query keys** (`todoKeys.detail(id)`), for hierarchy and invalidation                            |
| Community [`@lukemorales/query-key-factory`](https://github.com/lukemorales/query-key-factory)                                 | Package **named** factory                             | Typesafe key store — optional; we do **not** depend on it                                                                          |

So when Query people say “query key factory,” they usually mean TkDodo’s object-of-key-helpers (or that package) — **not** a core export named `factory`, and **not** GoF Factory Method. Our **resource factory** goes one step further: keys **and** `queryFn` / options together (aligned with official `queryOptions`, not keys-only).

### In this repo

| We say                       | What it is                                                                                                            | Where                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Resource / Query factory** | Module (e.g. `cardQueries`) with `all` / `detail` / `logs` — builds `queryKey` + `queryOptions` for a remote resource | [`lib/api/card.ts`](../lib/api/card.ts) · why/layout: [`data.md`](./data.md) · example above         |
| **Store factory**            | [`createStore`](../lib/create-store.ts) — sole Zustand import; returns a typed store hook with DevTools wired         | [`client-ui-state.md`](./client-ui-state.md)                                                         |
| **`vi.mock` factory**        | Callback Vitest runs to supply the mocked module exports                                                              | Vitest’s own word — [`testing.md`](./testing.md) · [vi.mock](https://vitest.dev/api/vi.html#vi-mock) |
| **`factories/` (folder)**    | Optional home for **test data builders** (fixtures) — “builder” here = fixture helper; see [Builder](#builder)        | [`project-structure.md`](./project-structure.md) — When needed; not the same as `lib/api/`           |

That `cardQueries` shape matches the official `groupOptions(id)` idea from [Query Options](https://tanstack.com/query/v5/docs/framework/react/guides/query-options), grouped per resource like TkDodo’s key factories.

### Same word elsewhere (so you don’t mix them up)

| Ecosystem                   | Typical “factory”                                                                 | Same idea?                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Testing** (Vitest / Jest) | `vi.mock` / `jest.mock` **factory** function; sometimes fixture factories         | Creates fakes / data for tests (colloquial)                                                                                         |
| **Zustand / store libs**    | `create` / wrapper that builds a store                                            | Creates a configured store (colloquial)                                                                                             |
| **React**                   | Rarely official; people say “component factory” for `createElement`-style helpers | Colloquial                                                                                                                          |
| **NestJS / DI**             | Provider factories                                                                | Framework creation hooks (closer to “inject a creator,” still not always full GoF)                                                  |
| **GoF / Java**              | Factory Method / Abstract Factory class hierarchies                               | The **formal** patterns — ancestor of the word; see [Relation to the GoF “Factory” patterns](#relation-to-the-gof-factory-patterns) |

If a doc says “factory” and you are unsure which kind, check **what it returns** (query options, store, mock module, fixture object) and which concern file owns that return type.

## Builder

**Builder** is also everyday engineering jargon — and, separately, a GoF design pattern. Docs and APIs mix the everyday verb (“this builds a path / query / fixture”) with fluent **`.foo().bar().build()`** APIs and the formal pattern. Same [function-era pattern drift](#function-era-pattern-drift) as [Factory](#factory).

### What it means (everyday)

A **builder** is anything whose job is to **assemble a value in steps** (or look like it does): set fields, chain options, then produce the finished object. People also say “path builder,” “query builder,” or “test data builder” for small helpers that return a string / query / fixture — even when there is **no** `.build()` and **no** GoF structure.

**Why bother:** many optional parts, readable step-by-step setup, or one place to normalize before the final value exists.

### Relation to the GoF “Builder” pattern

**Yes, related — same English idea, different strictness.**

GoF [Builder](https://refactoring.guru/design-patterns/builder) separates **how you assemble** a complex object from the finished product. Classic roles: Builder (steps), ConcreteBuilder, Product, optional Director (fixed recipe). Modern TypeScript usually collapses that into one **fluent** class: chain setters that return `this`, then `build()`.

|                          | **GoF Builder**                                                            | **“Builder” in many JS/TS libs**                                      |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Shared**               | Assemble something complex without a telescoping constructor               | Same impulse                                                          |
| **Typical shape**        | Builder + Product (+ Director); step methods; often `build()`              | Fluent chain (`where().orderBy()`), or a plain helper named “builder” |
| **Goal emphasis**        | Same construction process → different representations; many optional parts | Readable chaining / stepwise config                                   |
| **Do we implement GoF?** | —                                                                          | **Almost never as UML.** We use library fluent APIs or tiny helpers.  |

#### Side by side

**GoF-style / fluent Builder** (illustrative — not a pattern we maintain in-app):

```ts
class BoardCreateBuilder {
  #title = "";
  #orgId = "";
  #imageId?: string;

  title(title: string) {
    this.#title = title;
    return this; // fluent
  }

  orgId(orgId: string) {
    this.#orgId = orgId;
    return this;
  }

  imageId(imageId: string) {
    this.#imageId = imageId;
    return this;
  }

  build() {
    if (!this.#title || !this.#orgId) {
      throw new Error("title and orgId required");
    }
    return {
      title: this.#title,
      orgId: this.#orgId,
      imageId: this.#imageId,
    };
  }
}

const input = new BoardCreateBuilder()
  .title("Q3 roadmap")
  .orgId("org_1")
  .imageId("img_9")
  .build();
```

What matters in GoF/fluent Builder: **stepwise assembly**, then one **finished product**.

**Colloquial “builder” in this repo** — [`lib/paths.ts`](../lib/paths.ts) is often called a path builder in frontend habits ([`nextjs.md`](./nextjs.md)). It is just functions that return a string/`Route`. No chain, no `build()`, not GoF:

```ts
export const paths = {
  board: (boardId: string) => route(`/board/${boardId}`),
  organizationBilling: (organizationId: string) =>
    route(`/organization/${organizationId}/billing`),
};

// usage
router.push(paths.board(boardId));
```

| Question                       | Fluent / GoF Builder above                   | `paths.board`                                 |
| ------------------------------ | -------------------------------------------- | --------------------------------------------- |
| What is created?               | A **multi-field object** after several steps | A **path string** in one call                 |
| Steps / `build()`?             | Yes                                          | No                                            |
| Is this “the Builder pattern”? | Yes (fluent sketch of GoF)                   | **No** — everyday “helper that builds a path” |

**Library fluent builders you will meet** (closer to GoF’s _chaining_ habit, still not our code owning the pattern):

```ts
// Prisma Client — chain filters, then execute (query builder style)
await prisma.card.findMany({
  where: { listId },
  orderBy: { order: "asc" },
});

// Zod — chain refinements on a schema (fluent API; product is the schema)
z.string().trim().min(3).max(50);
```

Those are **vendor APIs shaped like builders**. Prefer their official docs for the installed version ([Match installed official docs](#match-installed-official-docs)); do not invent a parallel “BoardBuilder” class unless stepwise domain construction really hurts without it.

### Factory vs Builder (don’t collapse them)

Both are **creational**. Rough split used in pattern literature and reviews:

| Lead with…  | When the hard part is…                                                      | Example                                                                       |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Factory** | **Which** thing to create (or one-shot “give me the right config/instance”) | `cardQueries.detail(id)`, `createStore(…)`, `createNotifier()`                |
| **Builder** | **How** to assemble many optional / ordered parts into one product          | `new XBuilder().a().b().build()`, SQL/Prisma-style chains, rich test fixtures |

They can combine: a factory might _return_ a builder, or a builder’s `build()` might call a factory. In **this repo’s docs**, prefer:

- **factory** for `lib/api/*`, `createStore`, `vi.mock` factories
- **builder** for fluent/stepwise assembly, path helpers when we say “path builder,” and `factories/` **test data builders** (fixture helpers — name overlaps; see below)

If someone says “builder” but means `cardQueries`, they almost certainly mean **colloquial factory**. Point them at [Factory](#factory).

### In this repo / stack

| We say                                         | What it is                                      | GoF Builder?                                                                           |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Path builders / `paths.*`**                  | Functions returning typed routes                | No — colloquial                                                                        |
| **Test data builders** (optional `factories/`) | Helpers that assemble fixture objects for tests | Sometimes fluent; often just `makeCard({ … })` — still called builders in test culture |
| **Prisma / Zod chains**                        | Library fluent APIs                             | Vendor shape ≈ builder; we consume, don’t re-implement                                 |
| Homegrown `FooBuilder` classes                 | —                                               | **Avoid** unless a domain object truly needs stepwise construction                     |

### Same word elsewhere

| Ecosystem      | Typical “builder”                 | Notes                                                                                 |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| **GoF**        | Builder pattern                   | Formal — [refactoring.guru/builder](https://refactoring.guru/design-patterns/builder) |
| **ORMs / SQL** | Query builder                     | Knex, Prisma-style chaining, Criteria APIs                                            |
| **HTTP / SDK** | Request builder                   | `.method().url().send()`                                                              |
| **UI tools**   | “Preset builder,” form builders   | Product UI that assembles config — not GoF in our code                                |
| **Tests**      | Test data builder                 | Fixture helpers; folder may still be named `factories/`                               |
| **Java**       | `StringBuilder`, `*Builder` types | Everyday + pattern influence                                                          |

If a doc says “builder” and you are unsure, check: **is there a chain + final product**, or just English for “function that returns X”? Then see [Factory](#factory) if the thing is really a one-shot creation helper.

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

| Word                               | Where defined                                                                             | Quick meaning                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Match installed official docs**  | [Match installed official docs](#match-installed-official-docs) above                     | Use version-correct official docs for every dependency. SoT: [`conventions.md`](./conventions.md#match-installed-official-docs) · [`AGENTS.md`](../AGENTS.md)                                                                                                                                                                 |
| **One tool per job**               | [One tool per job](#one-tool-per-job) above                                               | Choose carefully; no parallel stack for the same purpose; replace only if the other tool dominates. Hard rule: [`conventions.md`](./conventions.md#one-tool-per-job) · [`AGENTS.md`](../AGENTS.md)                                                                                                                            |
| **billing** / **pricing plan** / … | [Billing terms](#billing-terms) above                                                     | Do not confuse pricing plans with project plans. Flows: [`billing.md`](./billing.md)                                                                                                                                                                                                                                          |
| **Function-era pattern drift**     | [Function-era pattern drift](#function-era-pattern-drift) above                           | In modern React/Next (functions dominate), GoF **names** stay while **shapes** loosen — intent without the class diagram. Frames [Factory](#factory) / [Builder](#builder).                                                                                                                                                   |
| **Factory**                        | [Factory](#factory) above                                                                 | One-shot creation helper (colloquial). Related to GoF Factory **in intent only**. Not the [Builder](#builder) pattern. Query: [`queryOptions`](https://tanstack.com/query/v5/docs/framework/react/guides/query-options). [`data.md`](./data.md) · [`client-ui-state.md`](./client-ui-state.md) · [`testing.md`](./testing.md) |
| **Builder**                        | [Builder](#builder) above                                                                 | Stepwise / fluent assembly (or everyday “path/query/fixture builder”). Related to GoF Builder **in intent only**. Distinct from [Factory](#factory). [`nextjs.md`](./nextjs.md) (`paths`) · Prisma/Zod chains                                                                                                                 |
| **Organization**                   | Clerk concept, used throughout                                                            | A tenant / team workspace. Write **organization** in prose, keep `orgId` in code                                                                                                                                                                                                                                              |
| **Authentication**                 | Sign-in / session identity                                                                | Write **authentication** in prose — do not abbreviate. Keep Clerk identifiers such as `auth()`, `useAuth`. Doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md)                                                                                                                                |
| **Authorization**                  | Whether an identity may do a specific action or see a resource                            | Write **authorization** in prose — do not abbreviate. Different from authentication. Same doc: [`authentication-and-authorization.md`](./authentication-and-authorization.md)                                                                                                                                                 |
| **Cache**                          | Overloaded — Redis/CDN vs Next framework caching vs TanStack Query                        | Disambiguate in [`data.md`](./data.md#cache-means-different-things-traditional-be-vs-next-vs-client). Do not invent a separate cache doc                                                                                                                                                                                      |
| **DAL** (Data Access Layer)        | Server module(s) that control **how/when** data is read/mutated and run **authorization** | Not a Next API — a pattern. Solid explanation + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only). Next snippets: [Data Security](https://nextjs.org/docs/app/guides/data-security#data-access-layer), [Authentication](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal)          |
| **DTO** (Data Transfer Object)     | Safe, minimal return shape across a boundary (not a raw DB row)                           | Produced by a DAL. Same idea as NestJS response DTOs. Teach + examples: [`data.md`](./data.md#dal-and-dto-not-auth-only)                                                                                                                                                                                                      |
| **Test name** (Vitest)             | String identifying a **`test`** (first argument to `test`)                                | Not “test title.” Not the suite name (`describe`’s first argument). Terms + naming: [`testing.md`](./testing.md)                                                                                                                                                                                                              |
| **Stub** (Vitest / testing)        | Minimal fake so code under test can run; usually not asserted on                          | Distinct from **mock** (assert calls) and **spy** (`vi.spyOn`). Glossary: [`testing.md`](./testing.md)                                                                                                                                                                                                                        |
| **Repo convention**                | [`conventions.md`](./conventions.md)                                                      | A rare rule this repo invents when no higher authority covers it                                                                                                                                                                                                                                                              |
| **Product choice**                 | [`product.md`](./product.md)                                                              | UX/copy we invent when no higher domain authority decides                                                                                                                                                                                                                                                                     |

## Keeping this current

If you rename or redefine any of these words, update **this file first**, then the docs that use them.
