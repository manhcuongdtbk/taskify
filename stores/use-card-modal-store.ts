import { createStore } from "@/lib/create-store";

type CardModalStore = {
  id?: string;
  open: (id: string) => void;
  close: () => void;
};

/** Client store for the card detail dialog — open iff `id` is set. */
export const useCardModalStore = createStore<CardModalStore>((set) => ({
  id: undefined,
  open: (id: string) => set({ id }, false, "open"),
  close: () => set({ id: undefined }, false, "close"),
}));

/** Derived open flag (invariant: open ⇔ id is set). Prefer select* over storing isOpen. */
export const selectCardModalIsOpen = (state: CardModalStore) =>
  state.id !== undefined;
