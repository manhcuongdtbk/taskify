/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `cardFactory` → Prisma `Card` row (FK `listId`, no nested `list`)
 * - `cardWithListTitleFactory` → `CardWithListTitle` (API detail: `list` is `{ title }` only)
 *
 * List row defaults live in `./list`. Do not redefine List factories here.
 */

import { Factory } from "fishery";

import { type Card } from "@/app/generated/prisma/client";
import { type CardWithListTitle } from "@/lib/prisma/query-options/card";

import { listFactory, rewindListFactory } from "./list";

export const cardFactory = Factory.define<Card>(({ sequence }) => {
  // First persist: createdAt === updatedAt (Prisma @default(now()) + @updatedAt).
  const now = new Date();

  return {
    id: `card_${sequence}`,
    title: "Ship P2",
    description: null,
    order: 0,
    // Placeholder FK — override when pairing with a real list / use cardWithListTitleFactory.
    listId: `list_${sequence}`,
    createdAt: now,
    updatedAt: now,
  };
});

export const cardWithListTitleFactory = Factory.define<CardWithListTitle>(
  ({ associations }) => {
    // API select is `{ title }` only (`cardWithListTitleArgs`). Build a full list row for
    // a real listId, then project to the payload shape.
    const listRow = listFactory.build();
    const title = associations.list?.title ?? listRow.title;
    const card = cardFactory.build({ listId: listRow.id });

    return {
      ...card,
      list: { title },
    };
  },
);

export const rewindCardFactory = () => {
  cardFactory.rewindSequence();
};

/** Rewinds list + card (with-list builds advance both). */
export const rewindCardWithListTitleFactory = () => {
  rewindListFactory();
  rewindCardFactory();
};
