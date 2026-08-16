import { describe, expect, test } from "vitest";

import {
  FREE_BOARD_LIMIT_SERVER_ERROR,
  FreeBoardLimitReachedError,
} from "./free-board-limit";

describe("FreeBoardLimitReachedError", () => {
  test("uses the shared Free-plan limit message", () => {
    const error = new FreeBoardLimitReachedError();

    expect(error.name).toBe("FreeBoardLimitReachedError");
    expect(error.message).toBe(FREE_BOARD_LIMIT_SERVER_ERROR);
  });
});
