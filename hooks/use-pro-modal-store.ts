import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ProModalStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

/** Client store for the Pro upgrade dialog (components/modals/pro-modal → Stripe). */
export const useProModalStore = create<ProModalStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }, false, "open"),
      close: () => set({ isOpen: false }, false, "close"),
    }),
    {
      name: "ProModalStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
