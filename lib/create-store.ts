import { pascalCase } from "es-toolkit/string";
import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

import { isDevelopment } from "@/lib/env";

type DevtoolsStateCreator<T> = StateCreator<
  T,
  [["zustand/devtools", never]],
  []
>;

/** `use-card-modal-store` → `CardModalStore` */
const storeNameFromFileBase = (base: string): string =>
  pascalCase(base.replace(/^use-/, ""));

/**
 * DevTools label from the calling `hooks/use-*-store.ts` frame.
 * Skips this module so the store file wins. Falls back to undefined if not found.
 */
const storeNameFromCallStack = (): string | undefined => {
  const stack = new Error().stack;
  if (!stack) return undefined;

  const storeFileRe =
    /(?:^|[/\\])(use-[a-z0-9-]+-store)\.[tj]sx?(?::\d|[?#]|$)/i;

  for (const line of stack.split("\n")) {
    if (line.includes("create-store")) continue;
    const match = line.match(storeFileRe);
    if (match?.[1]) return storeNameFromFileBase(match[1]);
  }

  return undefined;
};

/**
 * App Zustand store factory — wires Redux DevTools once for every store.
 * Store modules live in hooks/use-*-store.ts and call this instead of create/devtools.
 * DevTools instance name comes from that file name (`use-card-modal-store.ts` →
 * `CardModalStore`) — keep the export as the only `use*Store` identifier in the file.
 * See docs/client-ui-state.md.
 */
export const createStore = <T extends object>(
  initializer: DevtoolsStateCreator<T>,
) => {
  const name = isDevelopment ? storeNameFromCallStack() : undefined;

  if (isDevelopment && !name) {
    console.warn(
      "[createStore] Could not derive DevTools name from the call stack. Keep stores in hooks/use-*-store.ts. See docs/client-ui-state.md.",
    );
  }

  return create<T>()(
    devtools(initializer, {
      name,
      enabled: isDevelopment,
    }),
  );
};
