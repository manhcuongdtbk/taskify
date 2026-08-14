import { afterEach, describe, expect, test, vi } from "vitest";

const capturedDevtools = vi.hoisted(() => ({
  options: undefined as { name?: string; enabled?: boolean } | undefined,
}));

vi.mock("zustand/middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zustand/middleware")>();

  return {
    ...actual,
    devtools: (
      initializer: Parameters<typeof actual.devtools>[0],
      options: { name?: string; enabled?: boolean },
    ) => {
      capturedDevtools.options = options;
      return actual.devtools(initializer, options);
    },
  };
});

describe("createStore", () => {
  afterEach(() => {
    // `unstubEnvs` / `restoreMocks` are on in vitest.config.mts; still reset
    // modules that cached NODE_ENV, and the hoisted DevTools capture bag.
    vi.resetModules();
    capturedDevtools.options = undefined;
  });

  test("disables DevTools in production and still forwards the instance name", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }), "CardModalStore");

    expect(capturedDevtools.options).toStrictEqual({
      name: "CardModalStore",
      enabled: false,
    });
  });

  test("enables DevTools in development with the given instance name", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }), "CardModalStore");

    expect(capturedDevtools.options).toStrictEqual({
      name: "CardModalStore",
      enabled: true,
    });
  });
});
