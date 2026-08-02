import { create } from "zustand";
import { devtools } from "zustand/middleware";

type CardModalStore = {
  id?: string;
  isOpen: boolean;
  open: (id: string) => void;
  close: () => void;
};

export const useCardModalStore = create<CardModalStore>()(
  devtools(
    (set) => ({
      id: undefined,
      isOpen: false,
      open: (id: string) => set({ id, isOpen: true }, false, "open"),
      close: () => set({ id: undefined, isOpen: false }, false, "close"),
    }),
    {
      name: "CardModalStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
