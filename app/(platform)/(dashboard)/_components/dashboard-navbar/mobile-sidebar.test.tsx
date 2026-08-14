import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useMobileSidebarStore } from "@/stores/use-mobile-sidebar-store";
import { siteLocalStorageKeys } from "@/config/site";

const pathname = vi.hoisted(() => ({ current: "/organization/org_1" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("../dashboard-sidebar", () => ({
  DashboardSidebar: ({ storageKey }: { storageKey: string }) => (
    <div data-testid="dashboard-sidebar">{storageKey}</div>
  ),
}));

import { MobileSidebar } from "./mobile-sidebar";

describe("MobileSidebar", () => {
  beforeEach(() => {
    useMobileSidebarStore.getState().close();
    pathname.current = "/organization/org_1";
  });

  test("renders nothing before mount, then the menu button", async () => {
    render(<MobileSidebar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open navigation" }),
      ).toBeInTheDocument();
    });
  });

  test("opens the sheet with the dashboard sidebar", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open navigation" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(await screen.findByTestId("dashboard-sidebar")).toHaveTextContent(
      siteLocalStorageKeys.mobileSidebarExpanded,
    );
    expect(useMobileSidebarStore.getState().isOpen).toBe(true);
  });

  test("closes when the pathname changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MobileSidebar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open navigation" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(useMobileSidebarStore.getState().isOpen).toBe(true);

    pathname.current = "/organization/org_2";
    rerender(<MobileSidebar />);

    await waitFor(() => {
      expect(useMobileSidebarStore.getState().isOpen).toBe(false);
    });
  });
});
