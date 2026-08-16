import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { FREE_PLAN } from "@/constants/pricing-plans";
import { getAvailableCount } from "@/lib/organization-limit";
import { checkSubscription } from "@/lib/subscription";
import { useProModalStore } from "@/stores/use-pro-modal-store";
import {
  type UnsplashGetMockResult,
  unsplashGetNetworkError,
} from "@/lib/testing/unsplash/get-mock-result";

const unsplashGet = vi.hoisted(() =>
  vi.fn(async (): Promise<UnsplashGetMockResult> => unsplashGetNetworkError),
);

vi.mock("@/lib/organization-limit", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/organization-limit")>();
  return {
    ...actual,
    getAvailableCount: vi.fn(),
  };
});

vi.mock("@/lib/subscription", () => ({
  checkSubscription: vi.fn(),
}));

vi.mock("@/actions/create-board", () => ({
  createBoard: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/unsplash", () => ({
  unsplash: { GET: unsplashGet },
}));

vi.mock("next/image", () => import("@/lib/testing/next/image"));

import { CreateBoardTile } from "./create-board-tile";

const getAvailableCountMock = vi.mocked(getAvailableCount);
const checkSubscriptionMock = vi.mocked(checkSubscription);

const renderTile = async () => {
  const tile = await CreateBoardTile();
  return render(<TooltipProvider delay={0}>{tile}</TooltipProvider>);
};

describe("CreateBoardTile", () => {
  beforeEach(() => {
    useProModalStore.getState().close();
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("opens the create-board popover when the Free plan is below the cap", async () => {
    getAvailableCountMock.mockResolvedValue(0);
    checkSubscriptionMock.mockResolvedValue(false);
    const user = userEvent.setup();

    await renderTile();

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    expect(screen.getByText("5 remaining")).toBeInTheDocument();

    await user.click(createButton);

    expect(await screen.findByText("Create board")).toBeInTheDocument();
    expect(useProModalStore.getState().isOpen).toBe(false);
  });

  test("opens the pro modal from a single button when the Free plan is at cap", async () => {
    getAvailableCountMock.mockResolvedValue(FREE_PLAN.maxBoards);
    checkSubscriptionMock.mockResolvedValue(false);
    const user = userEvent.setup();

    await renderTile();

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    expect(screen.getByText("0 remaining")).toBeInTheDocument();

    await user.click(createButton);

    expect(useProModalStore.getState().isOpen).toBe(true);
    await waitFor(() => {
      expect(screen.queryByText("Create board")).not.toBeInTheDocument();
    });
  });

  test("shows unlimited remaining and still opens create when the organization is Pro", async () => {
    getAvailableCountMock.mockResolvedValue(FREE_PLAN.maxBoards);
    checkSubscriptionMock.mockResolvedValue(true);
    const user = userEvent.setup();

    await renderTile();

    expect(screen.getByText("Unlimited remaining")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create new board/i }));

    expect(await screen.findByText("Create board")).toBeInTheDocument();
    expect(useProModalStore.getState().isOpen).toBe(false);
  });
});
