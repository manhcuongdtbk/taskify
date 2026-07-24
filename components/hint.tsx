import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type BaseUIRenderForwardingProps } from "@/lib/types";

interface HintProps extends BaseUIRenderForwardingProps {
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function Hint({
  children,
  description,
  side = "bottom",
  sideOffset = 0,
}: HintProps) {
  return (
    <Tooltip>
      <TooltipTrigger delay={0} render={children} />
      <TooltipContent
        sideOffset={sideOffset}
        side={side}
        className="max-w-55 text-xs wrap-break-word"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
