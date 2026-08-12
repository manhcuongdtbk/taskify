/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `listFactory` → Prisma `List` row (FK `boardId`, no nested `cards`)
 * - `listWithCardsFactory` → `ListWithCards` (board column / API include shape)
 *
 * Do not put Card factories here — use `./card`. Pass cards via associations.
 */

import { Factory } from "fishery";

import { type List } from "@/app/generated/prisma/client";
import { type ListWithCards } from "@/lib/prisma/payloads";

export const listFactory = Factory.define<List>(({ sequence }) => {
  // First persist: createdAt === updatedAt (Prisma @default(now()) + @updatedAt).
  const now = new Date();

  return {
    id: `list_${sequence}`,
    title: "Todo",
    order: 0,
    // Placeholder FK — override when pairing with a real board.
    boardId: `board_${sequence}`,
    createdAt: now,
    updatedAt: now,
  };
});

export const listWithCardsFactory = Factory.define<ListWithCards>(
  ({ associations, afterBuild }) => {
    // TODO: Same DeepPartial review as cardWithListFactory — nested `cards` /
    // card field overlays vs list.id FK sync.
    // More info: https://github.com/thoughtbot/fishery#use-params-to-access-passed-in-properties
    afterBuild((list) => {
      for (const card of list.cards) {
        card.listId = list.id;
      }
    });

    const list = listFactory.build();

    return {
      ...list,
      cards: associations.cards ?? [],
    };
  },
);

export const rewindListFactory = () => {
  listFactory.rewindSequence();
};

/** Rewinds list sequence (with-cards builds use `listFactory`). */
export const rewindListWithCardsFactory = () => {
  rewindListFactory();
};
