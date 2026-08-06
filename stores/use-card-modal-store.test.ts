import { afterEach, describe, expect, test } from "vitest";

import { useCardModalStore } from "./use-card-modal-store";

describe("useCardModalStore", () => {
  afterEach(() => {
    useCardModalStore.getState().close();
  });

  test("starts closed with no id", () => {
    expect(useCardModalStore.getState()).toMatchObject({
      id: undefined,
      isOpen: false,
    });
  });

  test("open sets id and isOpen", () => {
    useCardModalStore.getState().open("card_1");

    expect(useCardModalStore.getState()).toMatchObject({
      id: "card_1",
      isOpen: true,
    });
  });

  test("close clears id and isOpen", () => {
    useCardModalStore.getState().open("card_1");
    useCardModalStore.getState().close();

    expect(useCardModalStore.getState()).toMatchObject({
      id: undefined,
      isOpen: false,
    });
  });

  test("open replaces a previous id", () => {
    useCardModalStore.getState().open("card_1");
    useCardModalStore.getState().open("card_2");

    expect(useCardModalStore.getState()).toMatchObject({
      id: "card_2",
      isOpen: true,
    });
  });
});
