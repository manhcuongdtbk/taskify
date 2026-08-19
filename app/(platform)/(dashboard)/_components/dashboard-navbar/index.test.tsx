import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/components/form/form-popover", () => ({
  FormPopover: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/fonts", () => ({
  calSansUI: { className: "font-cal-sans" },
}));

vi.mock("@clerk/nextjs", () => ({
  OrganizationSwitcher: () => <div data-testid="organization-switcher" />,
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock("./mobile-sidebar", () => ({
  MobileSidebar: () => <div data-testid="mobile-sidebar" />,
}));

vi.mock("./theme-toggler", () => ({
  ThemeToggler: () => <button type="button">Theme</button>,
}));

vi.mock("next/image", () => import("@/lib/testing/next/image"));

import { DashboardNavbar } from "./index";

describe("DashboardNavbar", () => {
  test("renders Create and a compact Create board control", () => {
    render(<DashboardNavbar />);

    expect(
      screen.getByRole("button", { name: /^Create$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create board" }),
    ).toBeInTheDocument();
  });
});
