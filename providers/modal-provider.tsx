"use client";

import { CardModal } from "@/components/modals/card-modal";
import { ProModal } from "@/components/modals/pro-modal";
import { useIsClient } from "usehooks-ts";

export const ModalProvider = () => {
  // TODO: replace this client-only gate — needed today to avoid hydration
  // mismatches when mounting portal-based modals.
  const isClient = useIsClient();

  if (!isClient) {
    return null;
  }

  return (
    <>
      <CardModal />
      <ProModal />
    </>
  );
};
