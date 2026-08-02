import { create } from "zustand";

type ProModalStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

/** Client store for the Pro upgrade dialog (components/modals/pro-modal → Stripe). */
export const useProModalStore = create<ProModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
