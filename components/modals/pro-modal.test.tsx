import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useProModalStore } from "@/stores/use-pro-modal-store";
import { PRO_PLAN, formatBoardLimit } from "@/constants/pricing-plans";
import { siteConfig } from "@/config/site";

const stripeRedirect = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/stripe-redirect", () => ({
  stripeRedirect,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("next/image", () => import("@/lib/testing/next/image"));

import { ProModal } from "./pro-modal";

const checkoutUrl = "https://checkout.stripe.test/session";

describe("ProModal", () => {
  beforeEach(() => {
    useProModalStore.getState().close();
    stripeRedirect.mockReset();
    toastAdd.mockReset();
  });

  test("renders upgrade content when the store is open", () => {
    useProModalStore.getState().open();

    render(<ProModal />);

    expect(
      screen.getByRole("heading", {
        name: `Upgrade to ${PRO_PLAN.name} Today!`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Explore the best of ${siteConfig.name}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatBoardLimit(PRO_PLAN.maxBoards)),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
  });

  test("redirects to the Stripe URL on successful upgrade", async () => {
    stripeRedirect.mockResolvedValue({ data: checkoutUrl });
    useProModalStore.getState().open();
    const user = userEvent.setup();
    const hrefSetter = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      set href(value: string) {
        hrefSetter(value);
      },
      get href() {
        return "";
      },
    });

    render(<ProModal />);
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    await waitFor(() => {
      expect(stripeRedirect).toHaveBeenCalledExactlyOnceWith({});
    });
    expect(hrefSetter).toHaveBeenCalledExactlyOnceWith(checkoutUrl);

    vi.unstubAllGlobals();
  });

  test("toasts on stripe redirect error", async () => {
    stripeRedirect.mockResolvedValue({ serverError: "Checkout failed" });
    useProModalStore.getState().open();
    const user = userEvent.setup();

    render(<ProModal />);
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Checkout failed",
      });
    });
  });
});
