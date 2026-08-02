"use client";

import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardSidebar } from "./dashboard-sidebar";

export const MobileSidebar = () => {
  const pathname = usePathname();

  // Helps prevent hydration errors. TODO: figure out why this is needed and whether there's a better way to handle this.
  const [isMounted, setIsMounted] = useState(false);

  // TODO: Figure out why we have to use this hook here instead of just using the state directly.
  const handleOpen = useMobileSidebar((state) => state.open);
  const handleClose = useMobileSidebar((state) => state.close);
  const isOpen = useMobileSidebar((state) => state.isOpen);

  useEffect(() => {
    // TODO: Fix this eslint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Close the mobile sidebar when the pathname changes.
  useEffect(() => {
    handleClose();
  }, [pathname, handleClose]);

  if (!isMounted) {
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
          <DashboardSidebar storageKey="taskify-mobile-sidebar-expanded" />
        </SheetContent>
      </Sheet>
    </>
  );
};
