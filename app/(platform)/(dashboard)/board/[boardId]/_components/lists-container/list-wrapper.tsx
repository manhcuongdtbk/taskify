import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const ListWrapper = ({
  className,
  children,
  ...props
}: ComponentProps<"li">) => {
  return (
    <li
      className={cn("h-full w-68 shrink-0 select-none", className)}
      {...props}
    >
      {children}
    </li>
  );
};
