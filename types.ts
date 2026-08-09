import { type List, type Card } from "@/app/generated/prisma/client";

export type ListWithCards = List & {
  cards: Card[];
};

export type CardWithList = Card & {
  list: List;
};
