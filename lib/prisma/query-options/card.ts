/**
 * Shared Prisma **query options** + optional GetPayload for `Card`-rooted queries.
 *
 * Lives under `lib/prisma/query-options/` (shapes only) — not next to `client.ts`
 * by accident: do **not** put `find*` / `create*` / authz here. Persistence is
 * `prisma.card` via `@/lib/prisma/client`; call sites (or a future server-only
 * access/DAL helper) own reads/writes. Not an Active Record model or repository.
 *
 * Export `*Args` for every reused include/select; add `*GetPayload` only when
 * callers need a named result type. These values are `CardDefaultArgs`-style
 * options (`select` / `include` / `omit`), not full `findUnique`/`findMany` args
 * (which also include `where`, `take`, top-level `orderBy`, etc.).
 *
 * https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types
 */

import { type Prisma } from "@/app/generated/prisma/client";

/** Card detail modal: card + list title only — `app/api/cards/[cardId]/route.ts`. */
export const cardWithListTitleArgs = {
  include: {
    list: {
      select: {
        title: true,
      },
    },
  },
} satisfies Prisma.CardDefaultArgs;

export type CardWithListTitle = Prisma.CardGetPayload<
  typeof cardWithListTitleArgs
>;
