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
});
