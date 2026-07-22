import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { calSansUI } from "@/styles/fonts";

export default function Logo() {
  return (
    <Link href="/">
      <div className="hidden items-center gap-x-2 transition hover:opacity-75 md:flex">
        <Image src="/logo.svg" alt="Logo" width={30} height={30} />
        <p className={cn("pb-1 text-lg text-neutral-700", calSansUI.className)}>
          Taskify
        </p>
      </div>
    </Link>
  );
}
