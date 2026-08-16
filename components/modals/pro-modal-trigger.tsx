"use client";

import { type ComponentProps } from "react";
import { useProModalStore } from "@/stores/use-pro-modal-store";

/** Opens the Pro upgrade modal. Pair with FormPopover when the Free plan is at cap. */
export const ProModalTrigger = ({ children }: ComponentProps<"span">) => {
  const handleOpen = useProModalStore((state) => state.open);

  return (
    <span className="contents" onClick={handleOpen}>
      {children}
    </span>
  );
};
