import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { paths } from "@/lib/paths";
import { boardFactory } from "@/lib/testing/factories/board";

vi.mock("@/lib/prisma/client");

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("./_components/board-navbar", () => ({
  BoardNavbar: () => null,
}));

import BoardIdLayout, { generateMetadata } from "./layout";

const authMock = vi.mocked(auth);
const findUniqueMock = vi.mocked(prisma.board.findUnique);
const notFoundMock = vi.mocked(notFound);
const redirectMock = vi.mocked(redirect);

const orgAuth = {
  orgId: "org_1",
} as Awaited<ReturnType<typeof auth>>;

const layoutProps = (boardId: string, children: ReactNode = null) =>
  ({
    children,
    params: Promise.resolve({ boardId }),
  }) as LayoutProps<"/board/[boardId]">;

describe("generateMetadata", () => {
  test("returns Board without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const metadata = await generateMetadata(layoutProps("board_1"));

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(metadata).toStrictEqual({ title: "Board" });
  });

  test("loads the board title for the active org", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(board);

    const metadata = await generateMetadata(layoutProps(board.id));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(metadata).toStrictEqual({ title: "Roadmap" });
  });

  test("returns Board when the row is missing for this org", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    const metadata = await generateMetadata(layoutProps("board_other"));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: "board_other", orgId: "org_1" },
    });
    expect(metadata).toStrictEqual({ title: "Board" });
  });
});

describe("BoardIdLayout", () => {
  test("redirects to select-org without querying when there is no orgId", async () => {
    authMock.mockResolvedValue({ orgId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    await expect(BoardIdLayout(layoutProps("board_1"))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(paths.selectOrg);
  });

  test("notFounds when the board is missing for this org", async () => {
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    await expect(BoardIdLayout(layoutProps("board_other"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: "board_other", orgId: "org_1" },
    });
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  test("loads the board for the active org", async () => {
    const board = boardFactory.build({ orgId: "org_1" });
    authMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(board);

    const result = await BoardIdLayout(layoutProps(board.id, "child"));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(result).toBeTruthy();
  });
});
