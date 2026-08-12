import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { auditLogFactory } from "@/lib/testing/factories/audit-log";

import { CardModalActivity } from "./card-modal-activity";

describe("CardModalActivity", () => {
  test("renders activity items from audit logs", () => {
    const log = auditLogFactory.build();
    render(<CardModalActivity items={[log]} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`created card "${log.entityTitle}"`, "i")),
    ).toBeInTheDocument();
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
