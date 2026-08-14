import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

import { isDevelopment } from "@/lib/env";

type DevtoolsStateCreator<T> = StateCreator<
  T,
  [["zustand/devtools", never]],
  []
>;

/**
 * App Zustand store factory — wires Redux DevTools once for every store.
 * Store modules live in stores/use-*-store.ts and call this instead of create/devtools.
 * `name` is Zustand's instance label (`use-card-modal-store.ts` → `"CardModalStore"`).
 * See docs/client-ui-state.md.
 */
export const createStore = <T extends object>(
  initializer: DevtoolsStateCreator<T>,
  name: string,
) =>
  create<T>()(
    devtools(initializer, {
      name,
      enabled: isDevelopment,
    }),
  );
