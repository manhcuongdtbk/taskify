"use client";

import { type ComponentProps } from "react";
import { useProModalStore } from "@/stores/use-pro-modal-store";

type ProModalTriggerProps = Omit<ComponentProps<"button">, "type" | "onClick">;

/** Opens the Pro upgrade modal. Pair with FormPopover when the Free plan is at cap. */
export const ProModalTrigger = ({
  children,
  className,
  ...props
}: ProModalTriggerProps) => {
  const handleOpen = useProModalStore((state) => state.open);

  return (
    <button type="button" className={className} {...props} onClick={handleOpen}>
      {children}
    </button>
  );
};
