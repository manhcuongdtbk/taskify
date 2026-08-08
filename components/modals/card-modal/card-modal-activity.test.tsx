import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { AuditLog } from "@/app/generated/prisma/client";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AvatarImage: ({ src }: { src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double for avatar
    <img alt="" src={src} />
  ),
}));

import { CardModalActivity } from "./card-modal-activity";

const log = {
  id: "log_1",
  orgId: "org_1",
  action: ACTION.CREATE,
  entityId: "card_1",
  entityType: ENTITY_TYPE.CARD,
  entityTitle: "Ship P2",
  userId: "user_1",
  userImage: "https://example.com/avatar.png",
  userName: "Ada Lovelace",
  createdAt: new Date("2026-01-15T10:30:00.000Z"),
  updatedAt: new Date("2026-01-15T10:30:00.000Z"),
} as AuditLog;

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

    expect(screen.queryByText("Activity")).not.toBeInTheDocument();
  });
});
