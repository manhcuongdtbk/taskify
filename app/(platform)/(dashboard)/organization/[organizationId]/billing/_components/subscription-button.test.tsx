import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useProModalStore } from "@/stores/use-pro-modal-store";
import { PRO_PLAN } from "@/constants/pricing-plans";

const stripeRedirect = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/actions/stripe-redirect", () => ({
  stripeRedirect,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { SubscriptionButton } from "./subscription-button";

const portalUrl = "https://billing.stripe.test/portal";

describe("SubscriptionButton", () => {
  beforeEach(() => {
    useProModalStore.getState().close();
    stripeRedirect.mockReset();
    toastAdd.mockReset();
  });

  test("opens the pro modal for free users", async () => {
    const user = userEvent.setup();

    render(<SubscriptionButton isPro={false} />);

    await user.click(
      screen.getByRole("button", { name: `Upgrade to ${PRO_PLAN.name}` }),
    );

    expect(useProModalStore.getState().isOpen).toBe(true);
    expect(stripeRedirect).not.toHaveBeenCalled();
  });

  test("redirects Pro users to the Stripe portal URL", async () => {
    stripeRedirect.mockResolvedValue({ data: portalUrl });
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

    render(<SubscriptionButton isPro />);
    await user.click(
      screen.getByRole("button", { name: "Manage Subscription" }),
    );

    await waitFor(() => {
      expect(stripeRedirect).toHaveBeenCalledExactlyOnceWith({});
    });
    expect(hrefSetter).toHaveBeenCalledExactlyOnceWith(portalUrl);

    vi.unstubAllGlobals();
  });

  test("toasts when stripe redirect fails for Pro users", async () => {
    stripeRedirect.mockResolvedValue({ serverError: "Portal failed" });
    const user = userEvent.setup();

    render(<SubscriptionButton isPro />);
    await user.click(
      screen.getByRole("button", { name: "Manage Subscription" }),
    );

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Portal failed",
      });
    });
  });
});
