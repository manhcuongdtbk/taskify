import { create } from "zustand";

type MobileSidebarStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useMobileSidebarStore = create<MobileSidebarStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
