import { render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { describe, expect, test } from "vitest";

import { generateAuditLogMessage } from "@/lib/generate-audit-log-message";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";

import { ActivityItem } from "./activity-item";

const timestampCopy = (createdAt: Date) =>
  format(createdAt, "MMM d, yyyy 'at' h:mm a");

describe("ActivityItem", () => {
  test("renders the actor, message, and formatted createdAt", () => {
    const auditLog = auditLogFactory.build();

    render(
      <ul>
        <ActivityItem auditLog={auditLog} />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.getByText(auditLog.userName)).toBeInTheDocument();
    expect(
      screen.getByText(generateAuditLogMessage(auditLog)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(timestampCopy(auditLog.createdAt)),
    ).toBeInTheDocument();
  });
});
