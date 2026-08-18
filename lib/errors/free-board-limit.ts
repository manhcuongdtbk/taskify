/** Free-plan board cap — shared by create-board and FormPopover. Not a Prisma `P*` code. */
// TODO: move into the `lib/board-limits/` feature folder once board-limit DAL + UI + domain error
// types are collocated.
export const FREE_BOARD_LIMIT_SERVER_ERROR =
  "You have reached your limit of free boards. Please upgrade to create more.";

export class FreeBoardLimitReachedError extends Error {
  override name = "FreeBoardLimitReachedError";

  constructor() {
    super(FREE_BOARD_LIMIT_SERVER_ERROR);
  }
}
