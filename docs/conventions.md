# Conventions

How to choose **engineering** patterns when something is ambiguous. Prefer existing conventions over inventing new ones — fewer custom rules means faster onboarding and less decision fatigue.

This repo is also a learning reference for the **Next.js App Router way** and chosen libraries (Prisma, Stripe, Clerk, …).

This page is for **language, web framework, and library** choices (how we write code), plus a living [**common practices catalog**](#common-practices-catalog) for habits that are not hard rules. Structure-specific priority and the **folder catalog** stay in [`project-structure.md`](./project-structure.md). **Where / how we fetch and mutate data** (App Router map, Pages Router orientation): [`data.md`](./data.md). **Project-management / certification** rules live in [`product.md`](./product.md) — do not put Scrum/PMI priority here.

**Before the table:** read [`vocabulary.md`](./vocabulary.md) so **convention**, **recommendation**, **common practice**, and **best practice** are not mixed up. Full catalog: [docs index](./README.md).

## Convention priority

When something is ambiguous, follow this **priority list** (highest first). Use the highest row that **owns this decision** — e.g. don’t force Next.js guidance onto a Stripe or Prisma API choice. Kind names use the definitions in [`vocabulary.md`](./vocabulary.md).

| Priority | Kind | Meaning |
| -------- | ---- | ------- |
| 1 | **Next.js convention** | Special APIs and file/folder rules the framework recognizes |
| 2 | **Next.js recommendation** | Approaches Next.js documents but does not enforce |
| 3 | **React convention** | Language/library rules (components, hooks, Server/Client Components where applicable) |
| 4 | **React recommendation** | Common React guidance that isn’t a hard rule |
| 5 | **Library convention** | Required APIs / contracts of a dependency (Prisma Client, Clerk, Stripe SDK, Zod, …) |
| 6 | **Library recommendation** | Approaches that library documents as preferred (not always required) |
| 7 | **TypeScript convention** | Language rules and standard `tsc` / DefinitelyTyped expectations |
| 8 | **TypeScript recommendation** | Official TS handbook guidance that isn’t a hard compiler rule |
| 9 | **JavaScript convention** | Language rules (ECMAScript semantics, standard library behavior) |
| 10 | **JavaScript recommendation** | Widely accepted JS style/guidance that isn’t a language rule |
| 11 | **Common practice** | See [`vocabulary.md`](./vocabulary.md) — widespread habit, not “best” |
| 12 | **Repo convention** | Only when the levels above don’t cover it; keep these rare |

Within the same kind, prefer the **current official docs** for the version this repo depends on (see `package.json`) over blog posts or memory.

### Where each kind is documented

| Kind | Learning / TODO doc in this repo | Official source of truth |
| ---- | -------------------------------- | ------------------------ |
| Next.js convention / recommendation | [`nextjs.md`](./nextjs.md), [`project-structure.md`](./project-structure.md) | [Next.js docs](https://nextjs.org/docs) (+ `node_modules/next/dist/docs/01-app/` for this version) |
| React convention / recommendation | *None yet* — RSC / `"use client"` covered under [`nextjs.md`](./nextjs.md); add `docs/react.md` only when we have React-specific TODOs beyond Next | [React docs](https://react.dev) |
| Library (Clerk) | [`authentication-and-authorization.md`](./authentication-and-authorization.md) | [Clerk docs](https://clerk.com/docs) |
| Library (Prisma) | [`prisma.md`](./prisma.md) | [Prisma docs](https://www.prisma.io/docs) |
| Library (Stripe) | [`billing.md`](./billing.md) | [Stripe docs](https://docs.stripe.com) |
| Library (Zod / shadcn / …) | *None yet* — use official docs; add a thin repo doc only when this repo has non-obvious choices or TODOs | [Zod](https://zod.dev) · [shadcn/ui](https://ui.shadcn.com) |
| TypeScript / JavaScript | *None yet* — follow handbook + this repo’s `tsconfig` / ESLint; add a doc only when we track concrete TODOs | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · [MDN / ECMAScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| Common practice | [Common practices catalog](#common-practices-catalog) (this file) + [folder catalog](./project-structure.md#common-practice-folders) | No sealed registry — see catalogs + linked sources |
| Repo convention | Short lists in this file + [`project-structure.md`](./project-structure.md) + process notes in concern docs (e.g. billing doc updates) | — (keep rare) |

## Common practices catalog

**Purpose:** a living list of **widespread habits** so the team spends less time rediscovering or arguing the same choices as the repo grows. This is **not** a sealed standard and **not** the same as [best practice](./vocabulary.md#rule-recommendation-common-practice-best-practice).

**How to use**

1. Prefer a higher row in [Convention priority](#convention-priority) when one applies (Next.js / React / library / TS docs win).
2. If several common practices conflict, pick one, mark status below, and move on — don’t invent a third house style.
3. **Folders** live in [`project-structure.md` → Common practice folders](./project-structure.md#common-practice-folders). This section is for **code / naming / workflow** habits.

**Status meanings**

| Status | Meaning |
| ------ | ------- |
| **Adopted** | Do this in this repo today |
| **When needed** | OK to adopt when a trigger or real need appears; document in the same change |
| **Avoid here** | Common elsewhere, but we deliberately don’t use it (or prefer an alternate) |

### Naming

| Practice | Status | Widespread sources |
| -------- | ------ | ------------------ |
| React components: **PascalCase** names | Adopted | [React: Your First Component](https://react.dev/learn/your-first-component) |
| Custom hooks: name starts with **`use`** | Adopted | [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) |
| Shared hooks live under `hooks/` (not sprinkled without reason) | Adopted | Habit; Next.js lists `hooks` as a [placeholder peer](https://nextjs.org/docs/app/getting-started/project-structure#examples) |
| File names for UI: **kebab-case** (e.g. `activity-item.tsx`) | Adopted | Widespread in Next/React codebases; no single sealed rule — stay consistent with neighbors |
| Server Action folders: **kebab-case** under `actions/<name>/` | Adopted | Repo shape; mirrors common “one folder per mutation” habit |
| App Router `page.tsx` / `layout.tsx` default exports: **route-mirrored `*Page` / `*Layout`** | Adopted | Common `*Page` suffix; **route mirroring is a repo rule** — see [Route-mirrored page/layout names](#route-mirrored-pagelayout-names). Enforced by `scripts/check-route-export-names.ts` (`pnpm lint:routes`; autofix with `pnpm lint:routes:fix`) |
| App Router special files: default export is **`export default [async] function`** (not `const` / arrow); named Next exports (`generateMetadata`, `GET`/`POST`, …) stay **`export [async] function`** | Adopted | Matches [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) / file-convention docs; at-a-glance “Next entry”. Enforced by ESLint (`eslint.config.mjs`) |
| Non-Next modules (components, `_components`, `lib`, …): named functions use **`export const Name = () =>`** / **`async () =>`** (not `export [async] function` or `export default [async] function`); **`memo` takes a named identifier only** (no inline arrow/`function`); **`ref` as a prop** (no `forwardRef`) | Adopted | Reserves `export [async] function` for Next specials; define-before-use; arrows for app fns. `memo(Foo)` keeps DevTools `.name`. React 19: pass `ref` on props — [`forwardRef`](https://react.dev/reference/react/forwardRef) is unnecessary / will be deprecated. Value defaults (`export default prisma`, configs) are fine. See [Export keyword shape](#component-export-names). **`components/ui/`** excluded (shadcn). Enforced by ESLint |
| App Router `page` / `layout` props: global **`PageProps` / `LayoutProps`** with correct route literal | Adopted | [Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) · [`nextjs.md`](./nextjs.md#route-props-helpers-pageprops--layoutprops--routecontext). Same script (`pnpm lint:routes` / `pnpm lint:routes:fix`) |
| App Router `route.ts` context: global **`RouteContext`** when the handler takes a 2nd arg | Adopted | [Route Context Helper](https://nextjs.org/docs/app/getting-started/route-handlers#route-context-helper) · [`nextjs.md`](./nextjs.md#route-props-helpers-pageprops--layoutprops--routecontext). Same script |
| App Router `route.ts`: **`NextRequest` / `NextResponse`** (not bare Web `Request` / `Response`) | Adopted | [Extended APIs](https://nextjs.org/docs/app/getting-started/route-handlers#extended-nextrequest-and-nextresponse-apis) · [`nextjs.md`](./nextjs.md#route-handlers-nextrequest--nextresponse). Same script |
| App UI components: **filename ↔ export**, **generics denylist**, **`Form*` in `components/form/`**, **`Component` → `ComponentProps`** | Adopted | See [Component export names](#component-export-names). Enforced via ESLint (`eslint-plugin-filename-match-export`, `@noctcore/eslint-plugin-react` `component-props-naming`, `@typescript-eslint/naming-convention` / `no-restricted-syntax`). **`components/ui/` excluded** (shadcn) |
| App UI: **folder colocation** + **one main named export per component file** (props local unless a consumer needs them); **no `export type` / `export interface` in component files** | Adopted | Folder layout: [`project-structure.md`](./project-structure.md). Public-surface rules: [Colocation and public exports](#colocation-and-public-exports). Importable UI types go in sibling `*.types.ts`. ESLint bans type co-exports in `components/**` + `app/**/_components/**` (not `ui/`, not `*.types.ts`) |
| **Companion files:** feature folders use bare `schema.ts` / `types.ts`; flat peers use role mid-suffixes (`*.test.tsx`, `*.stories.tsx`, `*.types.ts`, …) | Adopted / When needed | See [Companion files: role mid-suffixes vs bare names](#companion-files-role-mid-suffixes-vs-bare-names). Don’t mix both for the same concern |
| Env vars: **`SCREAMING_SNAKE_CASE`**; client-exposed only via `NEXT_PUBLIC_*` | Adopted | [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables) |
| Don’t put secrets in `NEXT_PUBLIC_*` or git | Adopted | Same Next.js guide · [Vercel Environment Variables](https://vercel.com/docs/environment-variables) |

#### Route-mirrored page/layout names

Next.js requires the **file** to be `page.tsx` / `layout.tsx`; it does **not** prescribe the default-export function name. This repo names that export from the route:

1. Suffix **`Page`** or **`Layout`** (match the file).
2. Build the prefix from path segments under `app/`:
   - Ignore private folders (`_components`, …) and parallel slots (`@slot`).
   - Ignore route groups `(name)` **unless** no URL segments remain (e.g. `(marketing)/page.tsx` → `MarketingPage`; `app/layout.tsx` → `RootLayout`).
   - `[param]` / `[...param]` / `[[...param]]` → PascalCase of the param (`organizationId` → `OrganizationId`).
   - Static segments: kebab-case → PascalCase (`select-org` → `SelectOrg`).
   - Drop a catch-all segment when it duplicates the previous token (`sign-in/[[...sign-in]]` → `SignInPage`).
3. Compose:
   - One token → that token + suffix (`ProtectedPage`).
   - Last token from a dynamic segment → that token + suffix (`OrganizationIdPage`, `BoardIdPage`).
   - Last token static (nested leaf) → **first static resource** + leaf + suffix (`OrganizationSettingsPage`, `OrganizationActivityPage`).
4. Do **not** use Rails-style Index/Show/New/Edit unless that word is a real URL segment.
5. **Do not** invent handwritten `{SameName}Props` for App Router `page` / `layout` — use Next’s global [`PageProps`](./nextjs.md#route-props-helpers-pageprops--layoutprops--routecontext) / `LayoutProps` helpers instead (see [`nextjs.md`](./nextjs.md)). For `route.ts`, use `RouteContext`. Enforced by `pnpm lint:routes` (same script as export names). The `noctcore-react/component-props-naming` rule still applies when someone *does* introduce a named props type on `app/**/page.tsx`; prefer not to.

#### Component export names

Applies to `components/**` **except** `components/ui/**`, and to `app/**/_components/**`.

Use **named** exports for these components (Next `page` / `layout` stay **default** — required by the framework). Named exports make route files vs UI obvious at a glance, and they support compound components on the same binding (e.g. `CardModalActivity.Skeleton`), in the spirit of [Base UI](https://base-ui.com/)-style composition.

**Export keyword shape** (enforced by ESLint; see catalog rows above):

- Next special files (`page`, `layout`, `route`, `proxy`, …): `export default [async] function …` and `export [async] function generateMetadata` / `GET` / …
- Everything else in app UI / `lib` / …: `export const Name = () =>` / `export const Name = async () =>` (not `export [async] function`, `export default [async] function`, or `export const Name = function Name`). For `memo`: **only** a named identifier — `const Foo = () => { … }; export const FooMemo = memo(Foo)` — not inline `memo(() => …)` or `memo(function …)`. `components/ui/` ignored. Non-function defaults (e.g. `export default prisma`, `next.config`) are allowed.

**Why this split:** Reserves `export [async] function` / `export default [async] function` for Next specials (at-a-glance framework entries) and prefers define-before-use + arrows for app modules.

**Refs:** React 19 — `ref` as a normal prop (no `forwardRef`). Details: [Refs (React 19)](#refs-react-19-ref-as-a-prop).

**DevTools / `memo`:** Plain `export const Foo = () =>` already has `.name`. Inline `memo(() => …)` / `memo(function …)` is anonymous → DevTools **Anonymous**. Require a named binding first (`const Foo = () => { … }; export const FooMemo = memo(Foo)`) so the inner keeps `.name` with no `displayName`. Enforced by ESLint (`no-restricted-syntax`); Next’s `react/display-name` is a backstop. `components/ui/` ignored.

##### Refs (React 19: `ref` as a prop)

A `ref` is a **handle** to a rendered DOM node (or a child that forwards to one). Parents use it for **imperative** work — focus, measure, `requestSubmit` — not for values that drive UI (those stay in props / state). Updating a ref does **not** re-render; putting a DOM node in `useState` would, and is the wrong tool.

**React 19 change:** `ref` is a normal prop. App components declare it on the props type and pass it down. Do **not** use [`forwardRef`](https://react.dev/reference/react/forwardRef) in app UI / `lib` (legacy; will be deprecated). ESLint bans importing it (`no-restricted-imports`). Call sites stay `<Child ref={…} />`. **`components/ui/`** (shadcn) may still ship `forwardRef` until regenerated — leave those alone.

**Why `ref?` (optional):** Same as with old `forwardRef`. React’s `RefAttributes` types `ref` as optional — most callers never need a handle. Only parents that focus/measure pass one (e.g. list → card form). Do not make `ref` required.

**Typing the prop** (pick one style and stay consistent in the file):

| Situation | Prefer |
| --------- | ------ |
| Custom props + forward to a known host node | `ref?: Ref<HTMLInputElement>` or `ref?: Ref<ComponentRef<"input">>` (same idea; DOM type is clearer when you’re sure) |
| Forward to a specific component | `ref?: Ref<ComponentRef<typeof Input>>` |
| Inherit / wrap a host element’s full props | `ComponentProps<"input">` / `ComponentPropsWithRef<"input">` — not needed just to add a single `ref` field |

Do **not** reach for `ComponentPropsWithRef` only to type `ref` on a hand-written props interface — declare `ref?: Ref<…>` explicitly.

**Forwarding chain** (custom components are not DOM nodes — each hop must pass `ref` until a host element):

1. Parent owns the box: `const textareaRef = useRef<HTMLTextAreaElement>(null)` then `<CardForm ref={textareaRef} />` and later `textareaRef.current?.focus()`.
2. Middle child accepts `ref` on props and passes it: `<FormTextarea ref={ref} />`.
3. Inner child puts it on the real node: `<Textarea ref={ref} />` → `<textarea>`.

**Examples in this repo:** `list-item.tsx` → `card-form.tsx` → `components/form/form-textarea.tsx` (and `form-input.tsx`).

**No `displayName`:** `export const FormInput = (…) =>` already has `.name === "FormInput"`. `displayName` was a workaround for anonymous `forwardRef((props, ref) => …)` wrappers. Named `export const` + ref-as-prop does not need it.

1. **Filename ↔ export** — `board-title-form.tsx` → `BoardTitleForm`. Enforced by `eslint-plugin-filename-match-export` (skips multi-export files and `index.*`). For `index.tsx`, name the export after the parent folder (`card-modal/index.tsx` → `CardModal`) — convention only; the plugin ignores `index`. Prefer **one** main named export so this check stays on — see [Colocation and public exports](#colocation-and-public-exports).
2. **Props type** — when the first parameter uses a named type, call it **`{Component}Props`** (e.g. `BoardTitleForm` → `BoardTitleFormProps`). Keep it **file-local** (non-exported) unless something outside must import it — then use sibling `*.types.ts`, not `export type` on the component file. **App Router `page` / `layout` are exempt** — use `PageProps` / `LayoutProps` ([`nextjs.md`](./nextjs.md#route-props-helpers-pageprops--layoutprops--routecontext)), not `BoardIdPageProps`. Naming enforced by [`@noctcore/eslint-plugin-react`](https://github.com/noctcore/eslint-plugins/tree/main/packages/eslint-plugin-react) `component-props-naming`; **no type co-export** enforced by ESLint `no-restricted-syntax` on app UI files (see [Colocation and public exports](#colocation-and-public-exports)). Inline object types and wrappers like `PropsWithChildren<…>` / `React.ComponentProps<…>` are left alone. **Watch noctcore:** it is new and low-adoption; we only enable this one rule. Revisit if the package goes unmaintained, breaks on ESLint upgrades, or an official/typescript-eslint equivalent appears — then swap to a small local rule.
3. **Generics denylist** — do not export these bare names as components: `Header`, `Footer`, `Navbar`, `Sidebar`, `Actions`, `Activity`, `Description`, `Info`, `Content`, `Item`. Qualify with the nearest useful segment (folder / route / feature), e.g. `CardModalHeader`, `OrganizationInfo`, `MarketingNavbar`, `DashboardSidebar`.
4. **`components/form/**`** — exported components must be prefixed **`Form`** (`FormInput`, `FormSubmit`, …); files stay `form-*.tsx`.
5. **Role affixes (doc only)** — prefer suffixes like `*Form`, `*Item`, `*Provider`, `*Button`; use a shared-kit **prefix** when the folder is a family (`Form*`). Not linted beyond `Form*`.
6. **Not enforced (automation)** — see [Enforcement status](#enforcement-status-colocation--companions) (folder layout scripts, test/story colocation checks, feature-folder triggers, …).

#### Colocation and public exports

Two different meanings of **colocation** (don’t mix them up):

| Sense | Meaning | This repo |
| ----- | ------- | --------- |
| **Folder colocation** | Related files live in the **same folder** (Angular-style: component + test + siblings) | **Adopted** — route `_components/`, feature folders like `components/modals/card-modal/`, `actions/<name>/`. Layout map: [`project-structure.md`](./project-structure.md) |
| **Same-file (local) types** | Props/`type`s sit **in the component file**, usually **not** exported | **Adopted default** for app UI — keeps one named export so filename ↔ export still runs |

**Repo rule:** use **both**. Folder-colocate features; keep each component file’s **public surface small** (one main named export). **Co-export** a second symbol only when another module must import it.

**Why avoid casual co-exports on UI files:** `eslint-plugin-filename-match-export` only checks files with **exactly one** named export. `export const Foo` + `export type FooProps` (or a second helper) turns the check **off**. Compounds like `Foo.Skeleton = …` are fine — they are not a second named export.

##### Companion files: role mid-suffixes vs bare names

**Companion** (or **sidecar**) files sit next to a primary module. A **role mid-suffix** is the conventional mark *before* the real extension (still `.ts` / `.tsx` / `.css`):

```text
board-title-form.tsx              ← primary
board-title-form.test.tsx         ← role mid-suffix: test
board-title-form.stories.tsx      ← role mid-suffix: stories
board-title-form.types.ts         ← role mid-suffix: types (only when needed)
FormInput.module.css              ← role mid-suffix: module (CSS Modules)
```

Tools match these with globs (`*.test.tsx`, `*.stories.tsx`). `eslint-plugin-filename-match-export` skips `*.test.*` / `*.spec.*` / `*.stories.*`.

**Bare names in a feature folder** — when the **folder** is the unit, use short fixed filenames instead of repeating the folder name as a mid-suffix:

```text
actions/create-board/
  index.ts      ← primary
  schema.ts     ← bare name (not create-board.schema.ts)
  types.ts      ← bare name (not create-board.types.ts)
```

| Shape | Prefer | Example |
| ----- | ------ | ------- |
| **Feature / action folder** (one concern per directory) | Bare `schema.ts`, `types.ts`, `index.ts` | `actions/create-board/` (Adopted) |
| **Flat folder** with many peer primaries | Mid-suffix companions | `form-input.tsx` + `form-input.test.tsx` / `form-input.types.ts` |
| Same concern | **Don’t** use both | Avoid `create-board/types.ts` *and* a loose `create-board.types.ts` outside |

**This repo’s lean**

| Kind | Convention | Status |
| ---- | ---------- | ------ |
| Server actions | Folder + bare `index.ts` / `schema.ts` / `types.ts` | Adopted |
| Unit / component tests | Mid-suffix `*.test.tsx` (or `*.test.ts`) next to the module | When needed |
| Storybook | Mid-suffix `*.stories.tsx` next to the component | When needed |
| CSS Modules | Mid-suffix `*.module.css` (if we use CSS Modules) | When needed |
| UI props types file | Mid-suffix `*.types.ts` only if a second file must `import type` | When needed — [below](#when-sibling-types-files-are-needed) |
| E2E | `e2e/` tree (not a mid-suffix on every component) | When needed |

Don’t invent new mid-suffixes unless a tool (Vitest, Storybook, bundler) will match them. Prefer `.test` over `.spec` for new Vitest files here (both are fine industry-wide; stay consistent).

##### Do this (examples already in tree)

**Folder colocation — feature UI**

```text
components/modals/card-modal/
  index.tsx                      → CardModal
  card-modal-header.tsx          → CardModalHeader
  card-modal-description.tsx
  …
```

**Folder colocation — server action** (types *are* co-exported because callers import them)

```text
actions/create-board/
  index.ts     → createBoard
  schema.ts    → CreateBoard
  types.ts     → InputType, ReturnType
```

**Same file, local props (app UI default)**

```ts
// board-title-form.tsx / card-modal-header.tsx pattern
interface BoardTitleFormProps {
  data: Board;
}

export const BoardTitleForm = ({ data }: BoardTitleFormProps) => { /* … */ };
```

**Compound on the same binding** (still one named export)

```ts
export const CardModalHeader = (/* … */) => { /* … */ };
CardModalHeader.Skeleton = function HeaderSkeleton() { /* … */ };
// usage: <CardModalHeader.Skeleton />
```

**Folder-colocated unit tests** (When needed — Vitest; none in tree yet). Prefer next to the module, not a catch-all `tests/` tree ([`project-structure.md`](./project-structure.md)):

```text
components/modals/card-modal/
  card-modal-header.tsx
  card-modal-header.test.tsx     ← Vitest + Testing Library

actions/create-board/
  schema.ts
  schema.test.ts
```

In the test, **import the component** and pass props **inline** in JSX — you do **not** need an exported props type:

```tsx
import { render, screen } from "@testing-library/react";
import { BoardTitleForm } from "./board-title-form";

render(
  <BoardTitleForm data={{ id: "b1", title: "Roadmap" /* … */ }} />,
);
```

Playwright E2E stays under `e2e/` (whole-app flows), not beside every component.

##### When co-export (or a sibling types file) is right

- Another module must import the type/helper (wrappers, shared kits, action `InputType` / `ReturnType`).
- Design-system / `components/ui/` style public API (e.g. `export { Button, buttonVariants }`) — `ui/` is ESLint-exempt for shadcn.
- Prefer a **sibling** `*.types.ts` (or `actions/<name>/types.ts`) over `export type` on the component file. App UI component files **must not** `export type` / `export interface` (ESLint); `*.types.ts` and `components/ui/` are exempt.

##### When sibling types files are needed

Use `*.types.ts` next to UI, or `actions/<name>/types.ts` for actions — same idea.

**Default:** do **not** add a types file. Keep props as a **non-exported** `interface` / `type` in the component module (`BoardTitleFormProps` in `board-title-form.tsx`, `FormInputProps` in `form-input.tsx`, …).

**Trigger:** will a **second file** need `import type { … }` for this symbol? If no → stay local. If yes → make it importable.

| Need | Do | Example in / near this repo |
| ---- | -- | --------------------------- |
| Props only used by that component | Local, unexported — **no** `*.types.ts` | `BoardTitleFormProps`, `CardItemProps`, `NavItemProps` |
| Test passes props in JSX | Still **no** types file — props **inline** | `render(<BoardTitleForm data={{ … }} />)` |
| Domain entity shared widely | Shared module — **not** `card-item.types.ts` | `CardWithList` in `types.ts`; Prisma `Board` |
| Action I/O imported by callers | `actions/<name>/types.ts` | `create-board/types.ts` → `InputType`, `ReturnType` |
| Wrapper / sibling must import component props | Sibling `foo.types.ts` (not `export type` on the component file) | Hypothetical: `form-input.types.ts` → `FormInputProps` for `form-input-with-hint.tsx` |
| Several siblings share one shape | One types module in the **same folder** | Hypothetical: `list-dnd.types.ts` used by `list-item.tsx` + `list-container.tsx` |

**Sibling UI example** (only when the import is real):

```text
components/form/
  form-input.tsx           → export const FormInput   (single named export)
  form-input.types.ts      → export type FormInputProps
  form-input-with-hint.tsx → import type { FormInputProps } from "./form-input.types"
```

**Rule of thumb:** the only “importer” would be a test that can pass props inline → **no** `*.types.ts`. For app UI, use sibling `*.types.ts` — do not co-export types from the component file (ESLint).

##### Cheat sheet

| Situation | Do |
| --------- | -- |
| Several UI pieces for one feature | Folder (`card-modal/`, route `_components/`) |
| Types/schema inside an action (or similar) folder | Bare `types.ts` / `schema.ts` — not `create-board.types.ts` |
| Test / story / CSS Module beside a flat peer file | Mid-suffix: `foo.test.tsx`, `foo.stories.tsx`, `foo.module.css` |
| Props only used by that component | Same file, **don’t** export — **no** `*.types.ts` |
| Types imported by actions / callers | `actions/…/types.ts` |
| Types imported by a UI wrapper / siblings | Sibling `*.types.ts` (ESLint forbids `export type` on the component file) |
| Shared domain model | `@/types` / Prisma — not per-component `*.types.ts` |
| Second UI under the same component | `.Skeleton` (etc.) on the export |
| Unit / component test | Colocate `*.test.tsx`; props inline; don’t export props “for tests” |
| E2E | `e2e/`, not next to every UI file |

##### Enforcement status (colocation & companions)

| Rule | Status |
| ---- | ------ |
| No `export type` / `export interface` in app UI component files (`components/**`, `app/**/_components/**`; not `ui/`; not `*.types.ts`) | **Enforced** (ESLint) |
| Export keyword shape / `memo` identifier-only / no `forwardRef` (ref-as-prop) / filename ↔ export / `Form*` / generics denylist | **Enforced** (ESLint) — see above |
| Action folder shape (`actions/<name>/` bare `index.ts` + `schema.ts` + `types.ts`) | **Docs only** — candidate for a `lint:routes`-style script later |
| Colocated `*.test.tsx` / `*.stories.tsx` must sit next to the primary module | **Docs only** — add checks when Vitest / Storybook land |
| Mid-suffix allowlist (forbid inventing `*.foo.tsx`) | **Docs only** |
| Feature-folder migration when triggers fire | **Docs only** ([`project-structure.md`](./project-structure.md)) |
| Create `*.types.ts` only when a real importer exists | **Docs only** (judgment) |
| `index.tsx` export named after parent folder | **Docs only** (plugin skips `index.*`) |
| Full path→name mirroring for `_components`; global symbol uniqueness | **Not enforced** |

### React / UI

| Practice | Status | Widespread sources |
| -------- | ------ | ------------------ |
| Think in components; compose small pieces | Adopted | [Thinking in React](https://react.dev/learn/thinking-in-react) |
| Prefer deriving state / skip unnecessary Effects | Adopted | [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) |
| **`ref` as a prop** (no `forwardRef` in app UI); optional `ref?: Ref<…>`; forward until a host node | Adopted | [Refs (React 19)](#refs-react-19-ref-as-a-prop) · [react.dev `forwardRef`](https://react.dev/reference/react/forwardRef) · [Referencing values with refs](https://react.dev/learn/referencing-values-with-refs). Enforced: no `forwardRef` import in app UI / `lib` (`components/ui/` excluded) |
| `"use client"` only where client APIs are required | Adopted | [React Server Components](https://react.dev/reference/rsc/server-components) · [Next.js Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| Shared providers under `components/providers/` (or similar) | Adopted | Common React habit; not a framework special folder |
| shadcn primitives only under `components/ui/` | Adopted (repo rule on top of habit) | [shadcn/ui docs](https://ui.shadcn.com/docs) · [project-structure](./project-structure.md) |
| Error boundaries for recoverable client UI failures | When needed | [React: Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) · Next [`error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/error) |
| Client data cache via **TanStack Query** (`QueryProvider`, `useQuery`, cache invalidation) | Adopted | [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) · used for client fetches (e.g. card modal). **When to use** vs RSC/Actions: [`data.md`](./data.md#tanstack-query-client-only). TODOs: `prefer-query-options`, provider setup. Query is **HTTP-client agnostic** ([query functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)) — it only needs a Promise |
| Query + transport defaults (docs / community) | Adopted / When needed | **REST / JSON:** Web `fetch` via `lib/fetcher.ts` (**Adopted**) — throw on `!res.ok`. **GraphQL:** [`graphql-request`](https://www.npmjs.com/package/graphql-request) as in [TanStack GraphQL guide](https://tanstack.com/query/latest/docs/framework/react/graphql) (**When needed** — only if we adopt GraphQL). **Mocks:** [MSW](https://mswjs.io) with Query (**When needed** — when we add tests). Prefer these over inventing a fourth stack |
| Client `fetch` vs Next server `fetch` | Adopted | Client Query uses Web [`fetch`](https://developer.mozilla.org/docs/Web/API/fetch) (`lib/fetcher.ts`). Server Components / server helpers use Next’s [extended `fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch) (`cache` / `revalidate` / `tags`) — same base API, not the same options. Don’t use Next cache options inside client `queryFn`s |
| **Axios** (or ky/ofetch) **with** TanStack Query | When needed | Optional if transport needs outgrow fetch: shared interceptors, uploads/progress, multi-app HTTP client. Query still owns cache/status. Don’t add “because blogs say use both” |
| **Axios** / ky beside `lib/fetcher` for the same simple JSON GETs | Avoid here | Extra dependency with no win for current card-modal calls |
| **SWR** as a second client-fetch library | Avoid here | Same job as TanStack Query ([SWR](https://swr.vercel.app) vs [Query](https://tanstack.com/query)); don’t add both |
| Client UI state with **Zustand** (modals, sidebars, …) | Adopted | [Zustand](https://zustand.docs.pmnd.rs) — already in `hooks/`. Don’t add Redux/Jotai alongside for the same job |
| URL state: Next **`searchParams`** first; **nuqs** when filters/tabs get painful | When needed | [Next.js `searchParams`](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional) · [nuqs](https://nuqs.47ng.com) — don’t invent a third URL-state lib |
| Optimistic UI for mutations | When needed | Prefer React [`useOptimistic`](https://react.dev/reference/react/useOptimistic) + Server Actions; TanStack Query optimistic updates only where Query already owns the cache |
| Internationalization with **next-intl** (when we ship a second locale) | When needed | Prefer [next-intl](https://next-intl.dev) for App Router over next-i18next / ad-hoc — [Next.js i18n routing](https://nextjs.org/docs/app/guides/internationalization) |
| Storybook for isolated UI | When needed | Prefer [Storybook](https://storybook.js.org) over Ladle/Histoire unless a strong reason appears |
| Feature flags: **Vercel Flags** first on this host; third-party (LaunchDarkly, …) only if we outgrow it | When needed | [Vercel Flags](https://vercel.com/docs/feature-flags) · don’t run two flag systems |

### TypeScript / JavaScript

| Practice | Status | Widespread sources |
| -------- | ------ | ------------------ |
| Prefer TypeScript for app code | Adopted | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · Next.js TS defaults |
| Validate **boundaries** (forms, Server Actions, webhooks) with a schema lib (Zod here) | Adopted | [Zod](https://zod.dev) · common “parse at the edge” habit |
| Co-locate types with the module that owns them; avoid a giant dumping-ground `types/` unless it earns its keep | Adopted | Common TS habit; this repo also has a root `types.ts` for a few shared shapes — don’t grow it blindly |
| Sibling **`*.types.ts`** / `actions/<name>/types.ts` when another file must `import type` | When needed | Default stays local unexported props on the component. Split only when a real importer exists — see [When sibling types files are needed](#when-sibling-types-files-are-needed) |
| Path alias `@/` → repo root | Adopted | [Next.js Absolute Imports](https://nextjs.org/docs/app/getting-started/installation#set-up-absolute-imports-and-module-path-aliases) |
| Shared `schemas/` when the same Zod types are imported across many features | When needed | Same as folder catalog — extract only after duplication hurts |
| Branded / opaque IDs for domain entities | When needed | Common TS hardening habit; optional |
| Barrel `index.ts` re-exports for a folder public API | When needed | Common but debated (bundle/DX tradeoffs) — OK for `actions/<name>/`; avoid mega-barrels at repo root |

### Next.js / App Router habits (not special folders)

These are **common ways people use Next.js**, distinct from hard [file conventions](https://nextjs.org/docs/app/getting-started/project-structure). Official docs still win when they disagree. Full list of topic guides: [Guides](https://nextjs.org/docs/app/guides). Stack learning TODOs: [`nextjs.md`](./nextjs.md).

| Practice | Status | Widespread sources |
| -------- | ------ | ------------------ |
| Type App Router page/layout/route props with global **`PageProps` / `LayoutProps` / `RouteContext`**; Route Handlers use **`NextRequest` / `NextResponse`** | Adopted | [Route Props Helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) · [Route Context Helper](https://nextjs.org/docs/app/getting-started/route-handlers#route-context-helper) · [Extended APIs](https://nextjs.org/docs/app/getting-started/route-handlers#extended-nextrequest-and-nextresponse-apis) · repo map [`nextjs.md`](./nextjs.md#route-props-helpers-pageprops--layoutprops--routecontext). Enforced by `pnpm lint:routes` |
| **`typedRoutes`** + slim **`lib/paths`** (cast-needed URLs only; path-helper **common practice**, not a React/Vue route table); **`experimental.typedEnv`** | Adopted | [Statically Typed Links](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links) · [typedEnv](https://nextjs.org/docs/app/api-reference/config/typescript#type-intellisense-for-environment-variables) · [`nextjs.md`](./nextjs.md#typed-routes-and-env). **`pnpm typecheck`**; ESLint bans `as Route` outside `lib/paths.ts` |
| **`Link` for in-app routes; plain `<a>` for external URLs**; **`target="_blank"` needs safe `rel`** | Adopted | [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) · [`nextjs.md`](./nextjs.md#link-vs-a). ESLint: `@next/next/no-html-link-for-pages`, `no-restricted-syntax` (external `Link`), `react/jsx-no-target-blank` |
| Keep `app/` mostly routing; shared code outside `app/` | Adopted | [Store project files outside of `app`](https://nextjs.org/docs/app/getting-started/project-structure#store-project-files-outside-of-app) |
| Colocate route-only UI in private folders (`_components`) | Adopted | [Private folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) |
| Prefer Server Actions for many UI-driven mutations | Adopted | [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) · deep dive [Server Actions guide](https://nextjs.org/docs/app/guides/server-actions) · repo map [`data.md`](./data.md) |
| Forms via Server Actions (not a separate forms framework by default) | Adopted | [Forms guide](https://nextjs.org/docs/app/guides/forms) — matches our `actions/` + form components · [`data.md`](./data.md) |
| Route Handlers (`app/api/...`) for webhooks / external HTTP | Adopted | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) · [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) · Stripe webhook in [`billing.md`](./billing.md) |
| Authorization / data safety inside Actions & Route Handlers (not only `proxy.ts`) | Adopted (tighten via TODOs) | [Data Security](https://nextjs.org/docs/app/guides/data-security) · tracked in [`nextjs.md`](./nextjs.md) |
| Authentication provider = **Clerk** (hosted; ship-fast choice) | Adopted | [Clerk](https://clerk.com/docs) · framing in [`product.md`](./product.md) / [`authentication-and-authorization.md`](./authentication-and-authorization.md). Next’s [Authentication guide](https://nextjs.org/docs/app/guides/authentication) is context only |
| Second authentication stack beside Clerk / hand-rolled crypto | Avoid here | Exit path is a **library** (e.g. [Better Auth](https://www.better-auth.com)) after an explicit product decision — see [`authentication-and-authorization.md`](./authentication-and-authorization.md) |
| Multi-tenant via **Clerk Organizations** (+ our board/`orgId` data) | Adopted | [Clerk Orgs](https://clerk.com/docs/organizations/overview) · Next [Multi-tenant guide](https://nextjs.org/docs/app/guides/multi-tenant) for App Router patterns |
| Route-first growth → feature folders when it hurts | Adopted (triggers) | [Split by feature or route](https://nextjs.org/docs/app/getting-started/project-structure#split-project-files-by-feature-or-route) · [project-structure](./project-structure.md#route-splitting-now--feature-splitting-later) |
| `loading.tsx` / `error.tsx` / `not-found.tsx` per segment as UX needs appear | When needed | [File conventions](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy) · [`nextjs.md`](./nextjs.md) TODOs |
| Streaming / `Suspense` for slow server subtrees | When needed | [Streaming guide](https://nextjs.org/docs/app/guides/streaming) · [getting started](https://nextjs.org/docs/app/getting-started/linking-and-navigating#streaming) |
| Parallel / intercepting routes (modals as routes, etc.) | When needed | [Parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) · [Intercepting routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes) |
| Redirects via Next helpers (`redirect`, `next.config`, proxy) | When needed | [Redirecting guide](https://nextjs.org/docs/app/guides/redirecting) — prefer documented helpers over ad-hoc window navigation |
| After-response work with `waitUntil` / background helpers | When needed | [Vercel `waitUntil`](https://vercel.com/docs/functions/functions-api-reference#waituntil) — don’t fake daemons on serverless |
| Cron-triggered Route Handlers | When needed | [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) |
| Durable / queued background jobs | When needed | Prefer **Vercel Queues** (or Cron + Route Handler) while work is simple on Vercel; evaluate **Inngest** / **Trigger.dev** only when you need durable multi-step workflows — pick **one** job system |
| Edge Config for small globally-read config | When needed | [Edge Config](https://vercel.com/docs/storage/edge-config) — only for that use case; not a general DB |
| Local **MDX** content with `@next/mdx` | When needed | Follow [MDX guide](https://nextjs.org/docs/app/guides/mdx) — required root [`mdx-components.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/mdx-components); store files under `content/`. Prefer `@next/mdx` over [Markdoc](https://markdoc.dev/docs/nextjs) unless we need Markdoc |
| Draft Mode for unpublished CMS/MDX preview | When needed | [Draft Mode](https://nextjs.org/docs/app/guides/draft-mode) — only with editorial preview |
| Content Security Policy | When needed | [CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) |
| Lazy-load heavy client components / libraries | When needed | [Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading) |
| Third-party scripts via `next/script` / `@next/third-parties` | When needed | [Scripts](https://nextjs.org/docs/app/guides/scripts) · [Third Party Libraries](https://nextjs.org/docs/app/guides/third-party-libraries) |
| JSON-LD for rich results / SEO | When needed | [JSON-LD](https://nextjs.org/docs/app/guides/json-ld) — marketing / public pages |
| Prevent theme / authentication flash before hydration | When needed | [Preventing flash](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration) — relevant to `next-themes` TODOs |
| View transitions for navigation meaning | When needed | [View transitions](https://nextjs.org/docs/app/guides/view-transitions) |
| Bundle analysis when performance regresses | When needed | [Package Bundling](https://nextjs.org/docs/app/guides/package-bundling) |
| `instrumentation.ts` / OpenTelemetry | When needed | [Instrumentation](https://nextjs.org/docs/app/guides/instrumentation) · [OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry) — see [`nextjs.md`](./nextjs.md) out of scope until we need it |
| Production readiness checklist before major launches | Adopted (as reference) | [Production checklist](https://nextjs.org/docs/app/guides/production-checklist) |
| Second billing provider behind an adapter | When needed | Product direction in [`product.md`](./product.md); keep Stripe paths until a real second PSP |
| Sass / CSS-in-JS as primary styling | Avoid here | We use Tailwind — [Tailwind in Next](https://nextjs.org/docs/app/getting-started/css#tailwind-css); see [Sass](https://nextjs.org/docs/app/guides/sass) / [CSS-in-JS](https://nextjs.org/docs/app/guides/css-in-js) only if forced |
| Custom Node server / static export as default deploy | Avoid here | Deploy on Vercel with the App Router server features we use — [Deploying to platforms](https://nextjs.org/docs/app/guides/deploying-to-platforms) |

### Tooling / repo workflow

| Practice | Status | Widespread sources |
| -------- | ------ | ------------------ |
| Commit the lockfile (`pnpm-lock.yaml`) | Adopted | [pnpm](https://pnpm.io/git) · common package-manager habit |
| Lint on the project’s ESLint config; don’t add a second style guide casually | Adopted | Repo `eslint.config.mjs` · [ESLint](https://eslint.org/docs/latest/) |
| **Prettier** for formatting; ESLint for code quality (via `eslint-config-prettier`) | Adopted | [Prettier](https://prettier.io) · [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) · `prettier-plugin-tailwindcss` · editor default formatter in `.vscode/settings.json` |
| Lint-staged (or equivalent) on commit | Adopted | Repo `lint-staged.config.mjs` |
| `.env.example` (or documented env list) without secrets | When needed | Common onboarding habit · [Next.js env docs](https://nextjs.org/docs/app/guides/environment-variables) |
| Co-located unit/component tests with **Vitest** + Testing Library | When needed | Prefer Vitest for new suites in this repo — [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) · [Vitest](https://vitest.dev/guide/). Next also documents [Jest](https://nextjs.org/docs/app/guides/testing/jest); don’t add both. Async Server Components → E2E, not unit runners. Place `*.test.tsx` next to the module; pass props inline — see [Colocation and public exports](./conventions.md#colocation-and-public-exports) |
| E2E tests with **Playwright** for critical flows | When needed | Prefer Playwright for new E2E here — [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright) · [Playwright](https://playwright.dev) · [Clerk testing](https://clerk.com/docs/testing/overview). Next also documents [Cypress](https://nextjs.org/docs/app/guides/testing/cypress); don’t add both |
| HTTP mocking in tests with **MSW** | When needed | Prefer [MSW](https://mswjs.io) over ad-hoc fetch mocks / nock |
| Conventional Commits | When needed | [Conventional Commits](https://www.conventionalcommits.org/) — only if the team agrees; not required today |
| Changesets / release notes automation | When needed | [Changesets](https://github.com/changesets/changesets) — more relevant if we publish packages |
| CI with **GitHub Actions** | When needed | Default on GitHub; cache Next builds per [CI Build Caching](https://nextjs.org/docs/app/guides/ci-build-caching) |
| Dependency updates with **Dependabot** | When needed | Prefer GitHub [Dependabot](https://docs.github.com/en/code-security/dependabot) over Renovate unless we need Renovate-specific rules |
| **Vercel Analytics** + **Speed Insights** | Adopted | Already in root `app/layout.tsx` — [Analytics guide](https://nextjs.org/docs/app/guides/analytics) · [Vercel Analytics](https://vercel.com/docs/analytics) · [Speed Insights](https://vercel.com/docs/speed-insights) |
| Error / performance monitoring with **Sentry** (when we need more than Analytics) | When needed | Prefer [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) as the first APM; don’t stack multiple error trackers |
| ADR / short decision records for big irreversible choices | When needed | [ADR](https://adr.github.io) habit — use when debates keep recurring |
| CODEOWNERS for sensitive paths | When needed | [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) |
| Monorepo with **Turborepo** + pnpm workspaces | When needed | Prefer [Turborepo](https://turbo.build/repo/docs) over Nx for a Vercel/Next split — only with a real second app/package. Multi-Zones only if we truly split frontends — [Multi-zones](https://nextjs.org/docs/app/guides/multi-zones) |
| Transactional email templates with **React Email** | When needed | Prefer [React Email](https://react.email) when we send product email beyond provider defaults |
| Keep Next.js docs fresh for coding agents | When needed | [AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents) · [Next.js MCP Server](https://nextjs.org/docs/app/guides/mcp) — useful for this learning repo |
| `src/` directory wrapping the app | Avoid here | Valid Next option ([docs](https://nextjs.org/docs/app/getting-started/project-structure)); this repo keeps roots at the project root on purpose |
| Separate `utils/` **and** `lib/` for the same kind of helpers | Avoid here | Both names are common placeholders; we standardize on **`lib/`** ([Next examples](https://nextjs.org/docs/app/getting-started/project-structure#examples)) |

### How to extend this catalog

When the team settles a new habit:

1. Add a row (or change **Status**) in the right table above **or** in the [folder catalog](./project-structure.md#common-practice-folders).
2. Link at least one **widespread** source (official docs preferred; well-known project structure guides OK as evidence of habit).
3. If it is truly unique to this repo, put it under [Repo conventions](#repo-conventions) instead — don’t pretend it is industry-wide.

## Where to look (libraries we use)

Prefer the library’s own docs before adding a repo rule. Repo learning guides and the full list live in the [docs index](./README.md). Official starting points: [Next.js](https://nextjs.org/docs), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html), [Clerk](https://clerk.com/docs), [Prisma](https://www.prisma.io/docs), [Stripe](https://docs.stripe.com), [Zod](https://zod.dev), [shadcn/ui](https://ui.shadcn.com).

## Repo conventions

Keep this list short. Structure rules: [`project-structure.md`](./project-structure.md). Stack learning TODOs: [docs index](./README.md). Code/naming habits: [Common practices catalog](#common-practices-catalog).

If you can solve a problem with a higher-priority source above, do that instead of adding a new repo rule.

## What not to invent

- House synonyms that contradict [`vocabulary.md`](./vocabulary.md) (billing vs pricing plan, organization / authentication / authorization prose rules, …)
- Inventing house synonyms for domain/cert terms this product’s audience already knows — see [`product.md`](./product.md)
- Parallel “house style” that contradicts Next.js, React, TypeScript, or a library’s required API
- Repo-only wrappers or patterns when the library already documents an equivalent approach
- Duplicating long excerpts from official docs here — link them and describe only what this repo chooses when there are multiple valid options
- Empty stack docs with no “already following” or TODOs — wait until there is something concrete to teach
- Concern docs named after a vendor (`stripe.md`, `clerk.md`, …) — see [docs index](./README.md)
