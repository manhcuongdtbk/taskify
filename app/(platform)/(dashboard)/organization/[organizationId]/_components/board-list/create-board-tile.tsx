import { FormPopover } from "@/components/form/form-popover";
import { Hint } from "@/components/hint";
import { HelpCircle } from "lucide-react";
import {
  getAvailableCount,
  isBelowFreeBoardCap,
} from "@/lib/organization-limit";
import {
  FREE_PLAN,
  PRO_PLAN,
  hasUnlimitedBoards,
} from "@/constants/pricing-plans";
import { checkSubscription } from "@/lib/subscription";
import { ProModalTrigger } from "@/components/modals/pro-modal-trigger";

/** Strip UA button chrome so the tile matches the old muted `div` face. */
const tileClassName =
  "appearance-none border-0 p-0 font-inherit text-inherit shadow-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 flex h-full w-full flex-col items-center justify-center gap-y-1 rounded-xs bg-muted transition hover:opacity-75";

const boardLimitHintDescription = `${FREE_PLAN.name} Workspaces can have up to ${FREE_PLAN.maxBoards} open boards. For unlimited boards, upgrade this workspace.`;

const boardLimitHintLabel = `${FREE_PLAN.name} plan board limit`;

export const CreateBoardTile = async () => {
  const availableCount = await getAvailableCount();
  const isPro = await checkSubscription();
  const remainingLabel =
    isPro && hasUnlimitedBoards(PRO_PLAN)
      ? "Unlimited"
      : FREE_PLAN.maxBoards - availableCount;
  const canCreate = isPro || isBelowFreeBoardCap(availableCount);

  const label = (
    <>
      <p className="text-sm">Create new board</p>
      <span className="text-xs">{`${remainingLabel} remaining`}</span>
    </>
  );

  const tile = canCreate ? (
    <FormPopover sideOffset={10} side="right">
      <button type="button" className={tileClassName}>
        {label}
      </button>
    </FormPopover>
  ) : (
    <ProModalTrigger className={tileClassName}>{label}</ProModalTrigger>
  );

  return (
    <div className="relative aspect-video h-full w-full">
      {tile}
      {/* TODO (P2 — docs/billing.md): Hint
                always describes the Free plan board limit even when isPro shows
                "Unlimited". Hide the Hint for Pro, or change the copy by plan. */}
      <div className="absolute right-2 bottom-2">
        <Hint sideOffset={40} description={boardLimitHintDescription}>
          <button
            type="button"
            aria-label={boardLimitHintLabel}
            className="font-inherit flex size-6 appearance-none items-center justify-center border-0 bg-transparent p-0 text-inherit shadow-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <HelpCircle aria-hidden className="h-3.5 w-3.5" />
          </button>
        </Hint>
      </div>
    </div>
  );
};
