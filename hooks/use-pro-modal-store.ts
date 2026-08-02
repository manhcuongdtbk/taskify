import { createStore } from "@/lib/create-store";

type ProModalStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

/** Client store for the Pro upgrade dialog (components/modals/pro-modal → Stripe). */
export const useProModalStore = createStore<ProModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }, false, "open"),
  close: () => set({ isOpen: false }, false, "close"),
}));
