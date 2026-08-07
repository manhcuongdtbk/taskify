import { afterEach, describe, expect, test } from "vitest";

import { useProModalStore } from "./use-pro-modal-store";

describe("useProModalStore", () => {
  afterEach(() => {
    useProModalStore.getState().close();
  });

  test("starts closed", () => {
    expect(useProModalStore.getState().isOpen).toBe(false);
  });

  test("open sets isOpen to true", () => {
    useProModalStore.getState().open();

    expect(useProModalStore.getState().isOpen).toBe(true);
  });

  test("close sets isOpen to false after open", () => {
    useProModalStore.getState().open();
    useProModalStore.getState().close();

    expect(useProModalStore.getState().isOpen).toBe(false);
  });
});
