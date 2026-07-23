"use client";

import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Sidebar from "./sidebar";

export default function MobileSidebar() {
  const pathname = usePathname();

  // Helps prevent hydration errors. TODO: figure out why this is needed and whether there's a better way to handle this.
  const [isMounted, setIsMounted] = useState(false);

  // TODO: Figure out why we have to use this hook here instead of just using the state directly.
  const onOpen = useMobileSidebar((state) => state.onOpen);
  const onClose = useMobileSidebar((state) => state.onClose);
  const isOpen = useMobileSidebar((state) => state.isOpen);

  useEffect(() => {
    // TODO: Fix this eslint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Close the mobile sidebar when the pathname changes.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Button
        onClick={onOpen}
        className="mr-2 block md:hidden"
        variant="ghost"
        size="sm"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-2 pt-10">
          <Sidebar storageKey="taskify-mobile-sidebar-expanded" />
        </SheetContent>
      </Sheet>
    </>
  );
}
