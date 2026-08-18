import { Hint } from "@/components/hint";
import { HelpCircle } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { getAvailableCount } from "@/lib/board-limits/organization-limit";
import { checkSubscription } from "@/lib/subscription";
import { FormPopover } from "@/components/form/form-popover";
import {
  getCreateBoardHintDescription,
  getCreateBoardHintLabel,
  getCreateBoardRemainingCopy,
} from "@/lib/board-limits/create-board-limit-copy";

/** Strip UA button chrome so the tile matches the old muted `div` face. */
const tileClassName =
  "appearance-none border-0 p-0 font-inherit text-inherit shadow-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 flex h-full w-full flex-col items-center justify-center gap-y-1 rounded-xs bg-muted transition hover:opacity-75";

export const CreateBoardTile = async () => {
  const { orgId } = await auth();

  const [availableCount, isPro] = await Promise.all([
    getAvailableCount(orgId),
    checkSubscription(orgId),
  ]);
  const remainingCopy = getCreateBoardRemainingCopy({
    availableCount,
    isPro,
  });
  const hintDescription = getCreateBoardHintDescription({ isPro });
  const hintLabel = getCreateBoardHintLabel({ isPro });

  return (
    <div className="relative aspect-video h-full w-full">
      <FormPopover sideOffset={10} side="right">
        <button type="button" className={tileClassName}>
          <p className="text-sm">Create new board</p>
          <span className="text-xs">{remainingCopy}</span>
        </button>
      </FormPopover>
      <div className="absolute right-2 bottom-2">
        <Hint sideOffset={40} description={hintDescription}>
          <button
            type="button"
            aria-label={hintLabel}
            className="font-inherit flex size-6 appearance-none items-center justify-center border-0 bg-transparent p-0 text-inherit shadow-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <HelpCircle aria-hidden className="h-3.5 w-3.5" />
          </button>
        </Hint>
      </div>
    </div>
  );
};
