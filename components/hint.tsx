import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HintProps {
  children: React.ReactNode;
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
    // TOOD: move TooltipProvider to the root layout? https://ui.shadcn.com/docs/components/base/tooltip#installation
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger delay={0}>{children}</TooltipTrigger>
        <TooltipContent
          sideOffset={sideOffset}
          side={side}
          className="max-w-55 text-xs wrap-break-word"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
