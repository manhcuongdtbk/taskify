import {
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from "vitest";
import { currentUser } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import { orgAuth } from "@/lib/testing/org-auth";
import { createAuditLog } from "./create-audit-log";

vi.mock("@/lib/prisma/client");

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/auth/get-org-auth");

const getOrgAuthMock = vi.mocked(getOrgAuth);
const currentUserMock = vi.mocked(currentUser);
const createMock = vi.mocked(prisma.auditLog.create);

const auditInput = {
  entityId: "board_1",
  entityType: ENTITY_TYPE.BOARD,
  entityTitle: "Roadmap",
  action: ACTION.CREATE,
};

describe("createAuditLog", () => {
  let logSpy: MockInstance<typeof console.log>;

  // Every failure path is swallowed through console.log — silence it for the
  // whole suite so the failure cases don't dump stack traces into the output.
  // `restoreMocks` / `mockReset` clear spy + mock state between tests.
  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  test("writes an audit log row for the action", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue({
      id: "user_1",
      imageUrl: "https://img.example/u.png",
      firstName: "Ada",
      lastName: "Lovelace",
    } as Awaited<ReturnType<typeof currentUser>>);
    createMock.mockResolvedValue(auditLogFactory.build());

    const result = await createAuditLog(auditInput);

    expect(createMock).toHaveBeenCalledExactlyOnceWith({
      data: {
        orgId: "org_1",
        entityId: "board_1",
        entityType: ENTITY_TYPE.BOARD,
        entityTitle: "Roadmap",
        action: ACTION.CREATE,
        userId: "user_1",
        userImage: "https://img.example/u.png",
        userName: "Ada Lovelace",
      },
    });
    expect(result).toBeUndefined();
  });

  test.for([
    {
      case: "missing orgId",
      orgId: null,
      user: {
        id: "user_1",
        imageUrl: "https://img.example/u.png",
        firstName: "Ada",
        lastName: "Lovelace",
      },
    },
    {
      case: "missing user",
      orgId: "org_1",
      user: null,
    },
  ])("returns a failure when $case", async ({ orgId, user }) => {
    getOrgAuthMock.mockResolvedValue(orgId ? orgAuth : null);
    currentUserMock.mockResolvedValue(
      user as Awaited<ReturnType<typeof currentUser>>,
    );

    const result = await createAuditLog(auditInput);

    expect(createMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      error: "Failed to create audit log",
    });
  });

  test("returns a failure when auditLog.create rejects", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
    currentUserMock.mockResolvedValue({
      id: "user_1",
      imageUrl: "https://img.example/u.png",
      firstName: "Ada",
      lastName: "Lovelace",
    } as Awaited<ReturnType<typeof currentUser>>);
    createMock.mockRejectedValue(new Error("db down"));

    const result = await createAuditLog(auditInput);

    expect(createMock).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith("[AUDIT_LOG_ERROR]", expect.any(Error));
    expect(result).toStrictEqual({
      error: "Failed to create audit log",
    });
  });
});
