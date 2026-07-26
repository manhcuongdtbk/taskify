"use client";

import { type ListWithCards } from "@/types";
import { ListHeader } from "./list-header";

interface ListItemProps {
  index: number;
  data: ListWithCards;
}

export function ListItem({ index, data }: ListItemProps) {
  return (
    <li className="h-full w-68 shrink-0 select-none">
      <div className="w-full rounded-md bg-[#f1f2f4] pb-2 shadow-md">
        <ListHeader data={data} />
      </div>
    </li>
  );
}
