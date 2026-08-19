import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SkeletonStatus } from "./skeleton-status";

describe("SkeletonStatus", () => {
  test("exposes a status landmark named from the heading", () => {
    render(
      <SkeletonStatus heading="Activity">
        <span>placeholder</span>
      </SkeletonStatus>,
    );

    const status = screen.getByRole("status", { name: "Loading Activity" });

    expect(status).toBeInTheDocument();
    expect(screen.getByText("placeholder")).toBeInTheDocument();
  });

  test("forwards extra div props", () => {
    render(
      <SkeletonStatus heading="Description" id="description-skeleton">
        <span>placeholder</span>
      </SkeletonStatus>,
    );

    expect(
      screen.getByRole("status", { name: "Loading Description" }),
    ).toHaveAttribute("id", "description-skeleton");
  });
});
