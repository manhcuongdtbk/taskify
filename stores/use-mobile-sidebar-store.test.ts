import { afterEach, describe, expect, test } from "vitest";

import { useMobileSidebarStore } from "./use-mobile-sidebar-store";

describe("useMobileSidebarStore", () => {
  afterEach(() => {
    useMobileSidebarStore.getState().close();
  });

  test("starts closed", () => {
    expect(useMobileSidebarStore.getState().isOpen).toBe(false);
  });

  test("open sets isOpen to true", () => {
    useMobileSidebarStore.getState().open();

    expect(useMobileSidebarStore.getState().isOpen).toBe(true);
  });

  test("close sets isOpen to false after open", () => {
    useMobileSidebarStore.getState().open();
    useMobileSidebarStore.getState().close();

    expect(useMobileSidebarStore.getState().isOpen).toBe(false);
  });
});
