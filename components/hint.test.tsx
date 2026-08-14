import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { type ComponentProps } from "react";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { Hint } from "./hint";

const openHint = async (
  user: UserEvent,
  triggerName: string,
  hint: Omit<ComponentProps<typeof Hint>, "children">,
) => {
  render(
    <TooltipProvider delay={0}>
      <Hint {...hint}>
        <button type="button">{triggerName}</button>
      </Hint>
    </TooltipProvider>,
  );

  expect(screen.queryByText(hint.description)).not.toBeInTheDocument();

  await user.hover(screen.getByRole("button", { name: triggerName }));

  return screen.findByText(hint.description);
};

describe("Hint", () => {
  test("shows the description on hover", async () => {
    const user = userEvent.setup();

    const description = await openHint(user, "Add", {
      description: "Create a board",
    });

    expect(description).toHaveAttribute("data-side", "bottom");
  });

  test("places the tooltip on the requested side with the requested offset", async () => {
    const user = userEvent.setup();
    const sideOffset = 8;

    const description = await openHint(user, "More", {
      description: "Board actions",
      side: "left",
      sideOffset,
    });

    expect(description).toHaveAttribute("data-side", "left");
    expect(
      screen.getByRole("presentation", { hidden: true }).style.transform,
    ).toContain(`-${sideOffset}px`);
  });
});
