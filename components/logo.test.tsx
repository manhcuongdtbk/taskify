import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { siteConfig } from "@/config/site";

vi.mock("next/image", () => import("@/lib/testing/next/image"));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/fonts", () => ({
  calSansUI: { className: "font-cal-sans" },
}));

import { Logo } from "./logo";

describe("Logo", () => {
  test("links home with the site name and logo image", () => {
    render(<Logo />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: siteConfig.name })).toHaveAttribute(
      "src",
      "/logo.svg",
    );
    expect(screen.getByText(siteConfig.name)).toBeInTheDocument();
  });
});
