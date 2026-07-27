import type { Metadata } from "next";
import { geistSans, geistMono } from "@/fonts";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";

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
      <body>{children}</body>
    </html>
  );
}
