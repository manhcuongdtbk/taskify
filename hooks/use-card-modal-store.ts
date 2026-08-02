import { create } from "zustand";

type CardModalStore = {
  id?: string;
  isOpen: boolean;
  open: (id: string) => void;
  close: () => void;
};

export const useCardModalStore = create<CardModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  open: (id: string) => set({ id, isOpen: true }),
  close: () => set({ id: undefined, isOpen: false }),
}));
