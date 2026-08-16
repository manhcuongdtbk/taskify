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

export const CreateBoardTile = async () => {
  const availableCount = await getAvailableCount();
  const isPro = await checkSubscription();
  const remainingLabel =
    isPro && hasUnlimitedBoards(PRO_PLAN)
      ? "Unlimited"
      : FREE_PLAN.maxBoards - availableCount;
  const canCreate = isPro || isBelowFreeBoardCap(availableCount);

  const tile = (
    <div className="relative flex aspect-video h-full w-full flex-col items-center justify-center gap-y-1 rounded-xs bg-muted transition hover:opacity-75">
      <p className="text-sm">Create new board</p>
      <span className="text-xs">{`${remainingLabel} remaining`}</span>
      {/* TODO (P2 — docs/billing.md): Hint
                always describes the Free plan board limit even when isPro shows
                "Unlimited". Hide the Hint for Pro, or change the copy by plan. */}
      <Hint
        sideOffset={40}
        description={`${FREE_PLAN.name} Workspaces can have up to ${FREE_PLAN.maxBoards} open boards. For unlimited boards, upgrade this workspace.`}
      >
        <HelpCircle className="absolute right-2 bottom-2 h-3.5 w-3.5" />
      </Hint>
    </div>
  );

  if (canCreate) {
    return (
      <FormPopover sideOffset={10} side="right">
        {tile}
      </FormPopover>
    );
  }

  return <ProModalTrigger>{tile}</ProModalTrigger>;
};
