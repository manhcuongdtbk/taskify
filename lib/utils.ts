import cssesc from "cssesc";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const absoluteUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
};

/**
 * Safe value for CSS `background-image` (and similar) from a stored URL.
 * Uses [cssesc](https://github.com/mathiasbynens/cssesc) to wrap/escape a CSS
 * string so the value cannot break out of `url("…")`. Pair with https-only
 * validation at the write boundary.
 */
export const cssUrl = (url: string) => {
  return `url(${cssesc(url, { wrap: true, quotes: "double" })})`;
};
