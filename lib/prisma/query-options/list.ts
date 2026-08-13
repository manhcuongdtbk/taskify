/**
 * Shared Prisma **query options** + optional GetPayload for `List`-rooted queries.
 *
 * Lives under `lib/prisma/query-options/` (shapes only) — not next to `client.ts`
 * by accident: do **not** put `find*` / `create*` / authz here. Persistence is
 * `prisma.list` via `@/lib/prisma/client`; call sites (or a future server-only
 * access/DAL helper) own reads/writes. Not an Active Record model or repository.
 *
 * Export `*Args` for every reused include/select; add `*GetPayload` only when
 * callers need a named result type.
 *
 * Note on nested relations: `listWithCardsOrderedByOrderAscArgs` includes
 * `cards: { orderBy: … }`. That `orderBy` is a **Card findMany option** used
 * inside a List include, so it belongs to the List payload contract (the whole
 * include tree), not to the top-level `List` findMany args. Name the field and
 * direction explicitly so a future `…Desc` (or other sort field) can coexist.
 *
 * https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types
 */

import { type Prisma } from "@/app/generated/prisma/client";

/** Board column: lists with cards ordered by `order` asc — `app/(platform)/.../board/[boardId]/page.tsx`. */
export const listWithCardsOrderedByOrderAscArgs = {
  include: {
    cards: {
      orderBy: {
        order: "asc",
      },
    },
  },
} satisfies Prisma.ListDefaultArgs;

export type ListWithCardsOrderedByOrderAsc = Prisma.ListGetPayload<
  typeof listWithCardsOrderedByOrderAscArgs
>;
