import {
  FREE_PLAN,
  PRO_PLAN,
  hasUnlimitedBoards,
} from "@/constants/pricing-plans";

export const getCreateBoardRemainingCopy = ({
  availableCount,
  isPro,
}: {
  availableCount: number;
  isPro: boolean;
}): string => {
  if (isPro && hasUnlimitedBoards(PRO_PLAN)) {
    return "Unlimited boards";
  }

  // Counter drift can make this go negative when switching plans.
  const remaining = Math.max(0, FREE_PLAN.maxBoards - availableCount);
  return `${remaining} remaining`;
};

export const getCreateBoardHintDescription = ({
  isPro,
}: {
  isPro: boolean;
}): string => {
  if (isPro && hasUnlimitedBoards(PRO_PLAN)) {
    return `${PRO_PLAN.name} Workspaces have unlimited open boards.`;
  }

  return `${FREE_PLAN.name} Workspaces can have up to ${FREE_PLAN.maxBoards} open boards. For unlimited boards, upgrade this workspace.`;
};

export const getCreateBoardHintLabel = ({ isPro }: { isPro: boolean }) => {
  return isPro
    ? `${PRO_PLAN.name} plan board limit`
    : `${FREE_PLAN.name} plan board limit`;
};
