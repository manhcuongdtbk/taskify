// https://nextjs.org/docs/app/api-reference/components/font#using-multiple-fonts

import { Geist, Geist_Mono } from "next/font/google";
import { CalSansUI } from "@calcom/cal-sans-ui/ui";
import { CalSansText } from "@calcom/cal-sans-ui/text";
import { CalSansGeo } from "@calcom/cal-sans-ui/geo";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const calSansUI = CalSansUI;

export const calSansText = CalSansText;

export const calSansGeo = CalSansGeo;
