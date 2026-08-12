/**
 * Shared Prisma include/select shapes and their result types.
 *
 * Prefer `*GetPayload` + `satisfies Prisma.*DefaultArgs` over hand-written
 * `Model & { relation }` — Prisma docs (v7): operating against partial structures.
 * Keep these args in sync with the queries that spread them.
 *
 * https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types
 */

import { type Prisma } from "@/app/generated/prisma/client";

/** Board column: lists with ordered cards — `app/(platform)/.../board/[boardId]/page.tsx`. */
export const listWithCardsArgs = {
  include: {
    cards: {
      orderBy: {
        order: "asc",
      },
    },
  },
} satisfies Prisma.ListDefaultArgs;

export type ListWithCards = Prisma.ListGetPayload<typeof listWithCardsArgs>;

/** Card detail modal: card + list title only — `app/api/cards/[cardId]/route.ts`. */
export const cardWithListArgs = {
  include: {
    list: {
      select: {
        title: true,
      },
    },
  },
} satisfies Prisma.CardDefaultArgs;

export type CardWithList = Prisma.CardGetPayload<typeof cardWithListArgs>;
