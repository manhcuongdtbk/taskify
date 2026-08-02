import type { Metadata } from "next";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { ClerkProvider } from "@/providers/clerk-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: [{ url: "/logo.svg", href: "/logo.svg" }],
};

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <ThemeProvider // https://ui.shadcn.com/docs/dark-mode/next#wrap-your-root-layout
        attribute="class"
        defaultTheme="light" // TODO: Revert to "system" and update the system to handle dark mode. More info on `ThemeProvider`: https://github.com/pacocoursey/next-themes#themeprovider
        enableSystem
        disableTransitionOnChange
      >
        {/* TODO: QueryProvider should wrap ThemeProvider or stay as is? */}
        <QueryProvider>
          <Toaster />
          <ModalProvider />
          {/* Single app-wide TooltipProvider (https://ui.shadcn.com/docs/components/base/tooltip#installation) for multiple tooltips within the app. */}
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
