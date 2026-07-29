# Conventions

How to choose **engineering** patterns when something is ambiguous. Prefer existing conventions over inventing new ones — fewer custom rules means faster onboarding and less decision fatigue.

This repo is also a learning reference for the **Next.js App Router way** and chosen libraries (Prisma, Stripe, Clerk, …).

This page is for **language, web framework, and library** choices (how we write code). Structure-specific priority stays in [`project-structure.md`](./project-structure.md). **Project-management / certification** rules live in [`product.md`](./product.md) — do not put Scrum/PMI priority here.

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
| Library (Clerk) | [`clerk.md`](./clerk.md) | [Clerk docs](https://clerk.com/docs) |
| Library (Prisma) | [`prisma.md`](./prisma.md) | [Prisma docs](https://www.prisma.io/docs) |
| Library (Stripe) | [`stripe.md`](./stripe.md) | [Stripe docs](https://docs.stripe.com) |
| Library (Zod / shadcn / …) | *None yet* — use official docs; add a thin repo doc only when this repo has non-obvious choices or TODOs | [Zod](https://zod.dev) · [shadcn/ui](https://ui.shadcn.com) |
| TypeScript / JavaScript | *None yet* — follow handbook + this repo’s `tsconfig` / ESLint; add a doc only when we track concrete TODOs | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · [MDN / ECMAScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| Common practice | [`project-structure.md`](./project-structure.md) (folder names like `components/`, `lib/`, `hooks/`) | Next.js [project structure examples](https://nextjs.org/docs/app/getting-started/project-structure#examples) (placeholders, not special folders) |
| Repo convention | Short lists in this file + [`project-structure.md`](./project-structure.md) + process notes in stack docs (e.g. Stripe doc updates) | — (keep rare) |

## Where to look (libraries we use)

Prefer the library’s own docs before adding a repo rule. Repo learning guides and the full list live in the [docs index](./README.md). Official starting points: [Next.js](https://nextjs.org/docs), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html), [Clerk](https://clerk.com/docs), [Prisma](https://www.prisma.io/docs), [Stripe](https://docs.stripe.com), [Zod](https://zod.dev), [shadcn/ui](https://ui.shadcn.com).

## Repo conventions

Keep this list short. Structure rules: [`project-structure.md`](./project-structure.md). Stack learning TODOs: [docs index](./README.md) (Next.js, Clerk, Prisma, Stripe).

If you can solve a problem with a higher-priority source above, do that instead of adding a new repo rule.

## What not to invent

- Calling **Pro** the billing *feature* — **billing** is the feature; **Free** and **Pro** are **pricing plans** (see [`vocabulary.md`](./vocabulary.md) / [`features.md`](./features.md))
- Using bare **plan** next to project-management copy when **pricing plan** or **project plan** is needed to avoid ambiguity
- Inventing house synonyms for domain/cert terms this product’s audience already knows — see [`product.md`](./product.md)
- Abbreviating **organization** as “org” in prose or UI copy (keep `orgId` — that name comes from Clerk)
- Abbreviating **authentication** as “auth” in prose or UI copy (keep Clerk names such as `auth()` / `useAuth`)
- Parallel “house style” that contradicts Next.js, React, TypeScript, or a library’s required API
- Repo-only wrappers or patterns when the library already documents an equivalent approach
- Duplicating long excerpts from official docs here — link them and describe only what this repo chooses when there are multiple valid options
- Empty stack docs with no “already following” or TODOs — wait until there is something concrete to teach
