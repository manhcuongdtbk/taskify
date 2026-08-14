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

const STORE_STACK_LINE = "    at stores/use-card-modal-store.ts:10:40";

const unparseableStack = [
  "Error",
  "    at createStore (lib/create-store.ts:48:17)",
  "    at Object.<anonymous> (lib/create-store.test.ts:1:1)",
].join("\n");

const storeFileStack = [
  "Error",
  "    at createStore (lib/create-store.ts:48:17)",
  STORE_STACK_LINE,
].join("\n");

describe("createStore", () => {
  afterEach(() => {
    // `unstubEnvs` / `restoreMocks` are on in vitest.config.mts; still reset
    // modules that cached NODE_ENV, and the hoisted DevTools capture bag.
    vi.resetModules();
    capturedDevtools.options = undefined;
  });

  test("disables DevTools and skips the call-stack name in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }));

    expect(warn).not.toHaveBeenCalled();
    expect(capturedDevtools.options).toStrictEqual({
      name: undefined,
      enabled: false,
    });
  });

  test("derives the DevTools name from a stores/use-*-store.ts frame", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(globalThis, "Error").mockImplementation(function MockError(
      this: Error,
    ) {
      const error = Object.create(Error.prototype) as Error;
      error.stack = storeFileStack;
      return error;
    });

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }));

    expect(warn).not.toHaveBeenCalled();
    expect(capturedDevtools.options).toStrictEqual({
      name: "CardModalStore",
      enabled: true,
    });
  });

  test("warns in development when the store file is missing from the stack", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(globalThis, "Error").mockImplementation(function MockError(
      this: Error,
    ) {
      const error = Object.create(Error.prototype) as Error;
      error.stack = unparseableStack;
      return error;
    });

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }));

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      "[createStore] Could not derive DevTools name from the call stack. Keep stores in stores/use-*-store.ts. See docs/client-ui-state.md.",
    );
    expect(capturedDevtools.options).toStrictEqual({
      name: undefined,
      enabled: true,
    });
  });

  test("skips naming when the call stack is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(globalThis, "Error").mockImplementation(function MockError(
      this: Error,
    ) {
      const error = Object.create(Error.prototype) as Error;
      error.stack = undefined;
      return error;
    });

    const { createStore } = await import("./create-store");
    createStore(() => ({ open: false }));

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      "[createStore] Could not derive DevTools name from the call stack. Keep stores in stores/use-*-store.ts. See docs/client-ui-state.md.",
    );
    expect(capturedDevtools.options).toStrictEqual({
      name: undefined,
      enabled: true,
    });
  });
});
