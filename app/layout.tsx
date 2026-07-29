import type { Metadata } from "next";
import { geistSans, geistMono } from "@/fonts";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";
import { SpeedInsights } from "@vercel/speed-insights/next"; // NOTE: https://vercel.com/docs/speed-insights/quickstart?framework=nextjs-app#add-the-speedinsights-component-to-your-app
import { Analytics } from "@vercel/analytics/next"; // NOTE: https://vercel.com/docs/analytics/quickstart?framework=nextjs-app#add-the-analytics-component-to-your-app

// TODO: setup tanstack query devtools. More info: https://tanstack.com/query/latest/docs/framework/react/devtools#install-and-import-the-devtools

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: [{ url: "/logo.svg", href: "/logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning // https://ui.shadcn.com/docs/dark-mode/next#wrap-your-root-layout
    >
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
