import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { Hint } from "./hint";

describe("Hint", () => {
  test("shows the description on hover", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0}>
        <Hint description="Create a board">
          <button type="button">Add</button>
        </Hint>
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Create a board")).toBeInTheDocument();
  });

  test("accepts a custom side and sideOffset", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delay={0}>
        <Hint description="Board actions" side="left" sideOffset={8}>
          <button type="button">More</button>
        </Hint>
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole("button", { name: "More" }));

    expect(await screen.findByText("Board actions")).toBeInTheDocument();
  });
});
