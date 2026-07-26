"use client";

import { type Card } from "@/app/generated/prisma/client";

interface CardItemProps {
  index: number;
  data: Card;
}

export function CardItem({ index, data }: CardItemProps) {
  return (
    <div
      className="truncate rounded-md border-2 border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-black"
      role="button"
    >
      {data.title}
    </div>
  );
}
