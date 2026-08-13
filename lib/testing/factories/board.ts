/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md (Fishery practices).
 *
 * - `boardFactory` → Prisma `Board` row (no nested `lists`)
 *
 * List row defaults live in `./list`. Do not redefine List factories here.
 */

import { constructNow } from "date-fns";
import { Factory } from "fishery";

import { type Board } from "@/app/generated/prisma/client";

export const boardFactory = Factory.define<Board>(({ sequence }) => {
  const instant = constructNow(undefined);

  return {
    id: `board_${sequence}`,
    orgId: `org_${sequence}`,
    title: "Roadmap",
    imageId: `img_${sequence}`,
    imageThumbUrl: "https://example.com/t",
    imageFullUrl: "https://example.com/f",
    imageUserName: "Ada",
    imageLinkHTML: "https://example.com",
    createdAt: instant,
    updatedAt: instant,
  };
});

export const rewindBoardFactory = () => {
  boardFactory.rewindSequence();
};
