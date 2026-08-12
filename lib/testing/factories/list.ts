/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `listFactory` → Prisma `List` row (FK `boardId`, no nested `cards`)
 * - `listWithCardsOrderedByOrderAscFactory` → `ListWithCardsOrderedByOrderAsc`
 *   (board column / API include shape; array order is a query contract, not
 *   encoded in the TypeScript payload shape)
 *
 * Do not put Card factories here — use `./card`. Pass cards via associations.
 */

import { Factory } from "fishery";

import { type List } from "@/app/generated/prisma/client";
import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";

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

export const listWithCardsOrderedByOrderAscFactory =
  Factory.define<ListWithCardsOrderedByOrderAsc>(
    ({ associations, afterBuild }) => {
      // TODO: Same DeepPartial review as cardWithListTitleFactory — nested `cards` /
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
export const rewindListWithCardsOrderedByOrderAscFactory = () => {
  rewindListFactory();
};
