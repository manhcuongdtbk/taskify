/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `cardFactory` → Prisma `Card` row (FK `listId`, no nested `list`)
 * - `cardWithListTitleFactory` → `CardWithListTitle` (API/UI: `list` is `{ title }` only)
 *
 * List row defaults live in `./list`. Do not redefine List factories here.
 * Fishery builds TypeScript types for tests — not a Prisma/ORM layer.
 */

import { constructNow } from "date-fns";
import { Factory } from "fishery";

import { type Card } from "@/app/generated/prisma/client";
import { type CardWithListTitle } from "@/lib/prisma/query-options/card";

import { listFactory, rewindListFactory } from "./list";

export const cardFactory = Factory.define<Card>(({ sequence, params }) => {
  const instant = constructNow(undefined);

  return {
    id: `card_${sequence}`,
    title: "Ship P2",
    description: null,
    order: 0,
    // Prefer a real List id; callers may override listId (e.g. payload factory).
    listId: params.listId ?? listFactory.build().id,
    createdAt: instant,
    updatedAt: instant,
  };
});

export const cardWithListTitleFactory = Factory.define<CardWithListTitle>(
  () => {
    const list = listFactory.build();

    return {
      ...cardFactory.build({ listId: list.id }),
      list: { title: list.title },
    };
  },
);

/** Rewinds list + card — card builds use `listFactory` when listId is not passed. */
export const rewindCardFactory = () => {
  rewindListFactory();
  cardFactory.rewindSequence();
};

/** Payload builds go through `cardFactory` — rewind both. */
export const rewindCardWithListTitleFactory = () => {
  rewindCardFactory();
};
