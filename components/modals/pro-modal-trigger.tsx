"use client";

import { type ReactNode } from "react";
import { useProModalStore } from "@/stores/use-pro-modal-store";

type ProModalTriggerProps = {
  children: ReactNode;
};

/** Opens the Pro upgrade modal. Pair with FormPopover when the Free plan is at cap. */
export const ProModalTrigger = ({ children }: ProModalTriggerProps) => {
  const handleOpen = useProModalStore((state) => state.open);

  return (
    <button type="button" className="contents" onClick={handleOpen}>
      {children}
    </button>
  );
};
