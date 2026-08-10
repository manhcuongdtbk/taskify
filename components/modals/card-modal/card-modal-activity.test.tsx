import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { cardAuditLogFactory } from "@/lib/testing/factories/card";

import { CardModalActivity } from "./card-modal-activity";

const log = cardAuditLogFactory.build();

describe("CardModalActivity", () => {
  test("renders activity items from audit logs", () => {
    render(<CardModalActivity items={[log]} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument();
    expect(screen.getByText(/created card "ship p2"/i)).toBeInTheDocument();
  });

  test("renders an empty list when there are no items", () => {
    render(<CardModalActivity items={[]} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  test("renders the activity skeleton", () => {
    render(<CardModalActivity.Skeleton />);

    expect(
      screen.getByRole("status", { name: /loading activity/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Activity")).not.toBeInTheDocument();
  });
});
