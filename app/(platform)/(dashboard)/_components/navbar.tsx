import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggler } from "./theme-toggler";
import { FormPopover } from "@/components/form/form-popover";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 flex h-14 w-full items-center border-b bg-white px-4 shadow-xs">
      <MobileSidebar />
      <div className="flex items-center gap-x-4">
        <div className="hidden md:flex">
          <Logo />
        </div>
        <FormPopover align="start" side="bottom" sideOffset={18}>
          <Button
            size="sm"
            className="hidden h-auto rounded-xs px-2 py-1.5 md:block"
          >
            Create
          </Button>
        </FormPopover>
        <FormPopover>
          <Button size="sm" className="block rounded-xs md:hidden">
            <Plus className="h-4 w-4" />
          </Button>
        </FormPopover>
      </div>
      <div className="ml-auto flex items-center gap-x-2">
        <ThemeToggler />
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/organization/:id"
          afterLeaveOrganizationUrl="/select-org"
          afterSelectOrganizationUrl="/organization/:id"
          appearance={{
            elements: {
              rootBox: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            },
          }}
        />
        <UserButton
          appearance={{ elements: { avatarBox: { height: 30, width: 30 } } }}
        />
      </div>
    </nav>
  );
}
