import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { FREE_PLAN } from "@/constants/pricing-plans";

vi.mock("@/components/create-board-trigger", () => ({
  CreateBoardTrigger: ({ children }: { children: ReactNode }) => children,
}));

import { CreateBoardTileView } from "./create-board-tile";

const boardLimitHintLabel = `${FREE_PLAN.name} plan board limit`;

const renderTile = (availableCount: number, isPro: boolean) =>
  render(
    <TooltipProvider delay={0}>
      <CreateBoardTileView availableCount={availableCount} isPro={isPro} />
    </TooltipProvider>,
  );

describe("CreateBoardTileView", () => {
  test("shows remaining boards when the Free plan is below the cap", () => {
    renderTile(0, false);

    expect(
      screen.getByRole("button", { name: /create new board/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 remaining")).toBeInTheDocument();
  });

  test("shows zero remaining when the Free plan is at cap", () => {
    renderTile(FREE_PLAN.maxBoards, false);

    expect(screen.getByText("0 remaining")).toBeInTheDocument();
  });

  test("shows unlimited remaining when the organization is Pro", () => {
    renderTile(FREE_PLAN.maxBoards, true);

    expect(screen.getByText("Unlimited remaining")).toBeInTheDocument();
  });

  test("names the board-limit hint and keeps it outside the create control", async () => {
    const user = userEvent.setup();

    renderTile(0, false);

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    const hintButton = screen.getByRole("button", {
      name: boardLimitHintLabel,
    });

    expect(createButton).not.toContainElement(hintButton);
    expect(createButton).toHaveClass("appearance-none", "border-0", "p-0");
    expect(hintButton).toHaveClass("size-6");
    expect(within(hintButton).queryByRole("img")).not.toBeInTheDocument();

    await user.hover(hintButton);

    expect(
      await screen.findByText(
        `${FREE_PLAN.name} Workspaces can have up to ${FREE_PLAN.maxBoards} open boards. For unlimited boards, upgrade this workspace.`,
      ),
    ).toBeInTheDocument();
  });
});
