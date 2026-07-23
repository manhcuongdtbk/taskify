import { Medal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { calSansUI, poppins } from "@/fonts";

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          calSansUI.className,
        )}
      >
        <div className="mb-4 flex items-center rounded-full border bg-amber-100 p-4 text-amber-700 uppercase shadow-sm">
          <Medal className="mr-2 h-6 w-5" />
          No 1 task management
        </div>
      </div>
      <h1 className="mb-6 text-center text-3xl text-neutral-800 md:text-6xl">
        Taskify helps team move
      </h1>
      <div className="w-fit rounded-md bg-linear-to-r from-fuchsia-600 to-pink-600 p-2 px-4 pb-4 text-3xl text-white md:text-6xl">
        work forward.
      </div>
      <div
        className={cn(
          "mx-auto mt-4 max-w-xs text-center text-sm text-neutral-400 md:max-w-2xl md:text-xl",
          poppins.className,
        )}
      >
        Collaborate, manage projects, and reach new productivity peaks. From
        high rises to the home office, the way your team works is unique —
        accomplish it all with Taskify.
      </div>
      <Link
        href="/sign-up"
        className={buttonVariants({
          variant: "default",
          size: "lg",
          className: "mt-6",
        })}
      >
        Get Taskify for free
      </Link>
    </div>
  );
}
