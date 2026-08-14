import { createStore } from "@/lib/create-store";

type MobileSidebarStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useMobileSidebarStore = createStore<MobileSidebarStore>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }, false, "open"),
    close: () => set({ isOpen: false }, false, "close"),
  }),
  "MobileSidebarStore",
);
