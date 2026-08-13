/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `listFactory` → Prisma `List` row (FK `boardId`, no nested `cards`)
 * - `listWithCardsOrderedByOrderAscFactory` → `ListWithCardsOrderedByOrderAsc`
 *   (board column shape; cards array order is a query contract)
 *
 * Do not put Card factories here — use `./card`. Pass cards via associations.
 * Board row defaults live in `./board`.
 */

import { constructNow } from "date-fns";
import { sortBy } from "es-toolkit";
import { Factory } from "fishery";

import { type List } from "@/app/generated/prisma/client";
import { type ListWithCardsOrderedByOrderAsc } from "@/lib/prisma/query-options/list";

import { boardFactory, rewindBoardFactory } from "./board";

export const listFactory = Factory.define<List>(({ sequence, params }) => {
  const instant = constructNow(undefined);

  return {
    id: `list_${sequence}`,
    title: "Todo",
    order: 0,
    // Prefer a real Board id; callers may override boardId.
    boardId: params.boardId ?? boardFactory.build().id,
    createdAt: instant,
    updatedAt: instant,
  };
});

export const listWithCardsOrderedByOrderAscFactory =
  Factory.define<ListWithCardsOrderedByOrderAsc>(
    ({ associations, afterBuild }) => {
      // Keep card.listId on this list after DeepPartial overlays of `cards`.
      // Copy each card — associations are caller-owned, and one card array may
      // be reused across list builds. Match Prisma `orderBy: { order: "asc" }`
      // on the query args — callers may pass associations in any order.
      afterBuild((list) => {
        list.cards = sortBy(
          list.cards.map((card) => ({ ...card, listId: list.id })),
          ["order"],
        );
      });

      const list = listFactory.build();

      return {
        ...list,
        cards: associations.cards ?? [],
      };
    },
  );

export const rewindListFactory = () => {
  rewindBoardFactory();
  listFactory.rewindSequence();
};

/** Rewinds list sequence (with-cards builds use `listFactory`). */
export const rewindListWithCardsOrderedByOrderAscFactory = () => {
  rewindListFactory();
};
