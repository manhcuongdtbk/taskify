"use client";

import { type ListWithCards } from "@/types";
import { ListForm } from "./list-form";
import { useEffect, useState } from "react";
import { ListItem } from "./list-item";

interface ListContainerProps {
  boardId: string;
  data: ListWithCards[];
}

export function ListContainer({ boardId, data }: ListContainerProps) {
  const [orderedData, setOrderedData] = useState(data);

  useEffect(() => {
    // TODO: Implement optimistic update
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderedData(data);
  }, [data]);

  return (
    <ol className="flex h-full gap-x-3">
      {orderedData.map((list, index) => (
        <ListItem key={list.id} index={index} data={list} />
      ))}
      <ListForm />
      <div className="w-1 shrink-0" />
    </ol>
  );
}
