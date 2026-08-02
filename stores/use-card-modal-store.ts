import { createStore } from "@/lib/create-store";

type CardModalStore = {
  id?: string;
  isOpen: boolean;
  open: (id: string) => void;
  close: () => void;
};

export const useCardModalStore = createStore<CardModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  open: (id: string) => set({ id, isOpen: true }, false, "open"),
  close: () => set({ id: undefined, isOpen: false }, false, "close"),
}));
