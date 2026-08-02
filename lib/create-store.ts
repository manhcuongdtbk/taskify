import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

type DevtoolsStateCreator<T> = StateCreator<
  T,
  [["zustand/devtools", never]],
  []
>;

/**
 * App Zustand store factory — wires Redux DevTools once for every store.
 * Store modules live in hooks/use-*-store.ts and call this instead of create/devtools.
 * See docs/client-ui-state.md.
 */
export const createStore = <T extends object>(
  name: string,
  initializer: DevtoolsStateCreator<T>,
) =>
  create<T>()(
    devtools(initializer, {
      name,
      enabled: process.env.NODE_ENV === "development",
    }),
  );
