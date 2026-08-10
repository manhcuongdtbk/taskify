import {
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from "vitest";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { createAuditLog } from "./create-audit-log";

vi.mock("@/lib/prisma", () => ({
  default: { auditLog: { create: vi.fn() } },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

const authMock = vi.mocked(auth);
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
    authMock.mockResolvedValue({ orgId: "org_1" } as Awaited<
      ReturnType<typeof auth>
    >);
    currentUserMock.mockResolvedValue({
      id: "user_1",
      imageUrl: "https://img.example/u.png",
      firstName: "Ada",
      lastName: "Lovelace",
    } as Awaited<ReturnType<typeof currentUser>>);
    createMock.mockResolvedValue({} as never);

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
    authMock.mockResolvedValue({ orgId } as Awaited<ReturnType<typeof auth>>);
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
    authMock.mockResolvedValue({ orgId: "org_1" } as Awaited<
      ReturnType<typeof auth>
    >);
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
