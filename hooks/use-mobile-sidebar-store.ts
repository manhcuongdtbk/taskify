import { create } from "zustand";
import { devtools } from "zustand/middleware";

type MobileSidebarStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useMobileSidebarStore = create<MobileSidebarStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }, false, "open"),
      close: () => set({ isOpen: false }, false, "close"),
    }),
    {
      name: "MobileSidebarStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
