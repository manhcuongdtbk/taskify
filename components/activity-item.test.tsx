import { render, screen } from "@testing-library/react";
import { format, parseISO } from "date-fns";
import { describe, expect, test } from "vitest";

import { generateAuditLogMessage } from "@/lib/generate-audit-log-message";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";

import { ActivityItem } from "./activity-item";

const timestampCopy = (createdAt: Date) =>
  format(createdAt, "MMM d, yyyy 'at' h:mm a");

describe("ActivityItem", () => {
  test("renders the actor, message, and formatted Date createdAt", () => {
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

  test("parses ISO string createdAt from Query JSON", () => {
    const auditLog = auditLogFactory.build();
    const isoCreatedAt = auditLog.createdAt.toISOString();

    render(
      <ul>
        <ActivityItem
          auditLog={{
            ...auditLog,
            createdAt: isoCreatedAt as unknown as Date,
          }}
        />
      </ul>,
    );

    expect(
      screen.getByText(timestampCopy(parseISO(isoCreatedAt))),
    ).toBeInTheDocument();
  });
});
