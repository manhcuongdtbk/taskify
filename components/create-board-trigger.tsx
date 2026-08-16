import { type ComponentProps } from "react";

import { FormPopover } from "@/components/form/form-popover";
import { ProModalTrigger } from "@/components/modals/pro-modal-trigger";
import { getBoardCreateAccess } from "@/lib/organization-limit";

type CreateBoardTriggerProps = ComponentProps<typeof FormPopover>;

/**
 * Async Server Component (gate). Vitest/jsdom cannot render it — Next’s Vitest
 * guide. Popover vs Pro modal in the running app is Playwright. docs/testing.md
 */
export const CreateBoardTrigger = async ({
  children,
  ...popover
}: CreateBoardTriggerProps) => {
  const { canCreate } = await getBoardCreateAccess();

  if (canCreate) {
    return <FormPopover {...popover}>{children}</FormPopover>;
  }

  return <ProModalTrigger>{children}</ProModalTrigger>;
};
