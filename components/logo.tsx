import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { calSansUI } from "@/fonts";
import { siteConfig } from "@/config/site";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="hidden items-center gap-x-2 transition hover:opacity-75 md:flex">
        <Image src="/logo.svg" alt={siteConfig.name} width={30} height={30} />
        <p className={cn("pb-1 text-lg text-neutral-700", calSansUI.className)}>
          {siteConfig.name}
        </p>
      </div>
    </Link>
  );
};
