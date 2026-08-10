"use client";

import { useMobileSidebarStore } from "@/stores/use-mobile-sidebar-store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { siteLocalStorageKeys } from "@/config/site";
import { Menu } from "lucide-react";
import { useIsClient } from "usehooks-ts";
import { DashboardSidebar } from "./dashboard-sidebar";

export const MobileSidebar = () => {
  const pathname = usePathname();
  // TODO: replace this client-only gate — needed today to avoid hydration
  // mismatches from Sheet portal + DashboardSidebar useLocalStorage.
  const isClient = useIsClient();

  const handleOpen = useMobileSidebarStore((state) => state.open);
  const handleClose = useMobileSidebarStore((state) => state.close);
  const isOpen = useMobileSidebarStore((state) => state.isOpen);

  // Close the mobile sidebar when the pathname changes.
  useEffect(() => {
    handleClose();
  }, [pathname, handleClose]);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        className="mr-2 block md:hidden"
        variant="ghost"
        size="sm"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="left" className="p-2 pt-10">
          <DashboardSidebar
            storageKey={siteLocalStorageKeys.mobileSidebarExpanded}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
