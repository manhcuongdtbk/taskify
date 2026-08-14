import { afterEach, describe, expect, test } from "vitest";

import {
  selectCardModalIsOpen,
  useCardModalStore,
} from "./use-card-modal-store";

describe("useCardModalStore", () => {
  afterEach(() => {
    useCardModalStore.getState().close();
  });

  test("starts with no id", () => {
    expect(useCardModalStore.getState().id).toBeUndefined();
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(false);
  });

  test("open sets id", () => {
    useCardModalStore.getState().open("card_1");

    expect(useCardModalStore.getState().id).toBe("card_1");
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(true);
  });

  test("close clears id", () => {
    useCardModalStore.getState().open("card_1");
    useCardModalStore.getState().close();

    expect(useCardModalStore.getState().id).toBeUndefined();
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(false);
  });

  test("open replaces a previous id", () => {
    useCardModalStore.getState().open("card_1");
    useCardModalStore.getState().open("card_2");

    expect(useCardModalStore.getState().id).toBe("card_2");
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(true);
  });

  // Matches `enabled: !!id` in lib/api/card — an empty id must not read as open,
  // or the dialog renders skeletons forever with both queries disabled.
  test("an empty id does not count as open", () => {
    useCardModalStore.getState().open("");

    expect(useCardModalStore.getState().id).toBe("");
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(false);
  });
});
