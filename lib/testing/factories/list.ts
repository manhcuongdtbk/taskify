/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `listFactory` → Prisma `List` row (FK `boardId`, no nested `cards`)
 * - `listWithCardsOrderedByOrderAscFactory` → `ListWithCardsOrderedByOrderAsc`
 *   (board column shape; cards array order is a query contract)
 *
 * Do not put Card factories here — use `./card`. Pass cards via associations.
 */

import { constructNow } from "date-fns";
import { Factory } from "fishery";

import { type List } from "@/app/generated/prisma/client";
import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";

export const listFactory = Factory.define<List>(({ sequence }) => {
  const instant = constructNow(undefined);

  return {
    id: `list_${sequence}`,
    title: "Todo",
    order: 0,
    // Placeholder FK — override when pairing with a real board.
    boardId: `board_${sequence}`,
    createdAt: instant,
    updatedAt: instant,
  };
});

export const listWithCardsOrderedByOrderAscFactory =
  Factory.define<ListWithCardsOrderedByOrderAsc>(
    ({ associations, afterBuild }) => {
      // Keep card.listId on this list after DeepPartial overlays of `cards`.
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
