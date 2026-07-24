import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HintProps {
  // Typed as ReactElement (not ReactNode) so it can be passed to the `render`
  // prop of Base UI's TooltipTrigger — the Base UI equivalent of Radix's asChild.
  children: React.ReactElement;
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
        <TooltipTrigger delay={0} render={children} />
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
