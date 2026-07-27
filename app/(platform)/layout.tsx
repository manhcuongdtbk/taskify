import type { Metadata } from "next";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";
import { ClerkProvider } from "@/components/clerk-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: [{ url: "/logo.svg", href: "/logo.svg" }],
};

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          {/* TODO: Use shadcn ui Sonner when it's available. Currently Sonner is only available for React Aria and Radix UI shadcn ui. */}
          <Toaster />
          <ModalProvider />
          {/* Single app-wide TooltipProvider (https://ui.shadcn.com/docs/components/base/tooltip#installation) for multiple tooltips within the app. */}
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
