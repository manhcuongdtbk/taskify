import Logo from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  return (
    <div className="fixed top-0 flex h-14 w-full items-center border-b bg-white px-4 shadow-sm">
      <div className="mx-auto flex w-full items-center justify-between md:max-w-screen-2xl">
        <Logo />
        <div className="flex w-full items-center justify-between space-x-4 md:block md:w-auto">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Get Taskify for free
          </Link>
        </div>
      </div>
    </div>
  );
}
