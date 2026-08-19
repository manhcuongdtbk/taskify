import { notFound, redirect } from "next/navigation";
import { type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { paths } from "@/lib/paths";
import { boardFactory } from "@/lib/testing/factories/board";
import { orgAuth } from "@/lib/testing/org-auth";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

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

const getOrgAuthMock = vi.mocked(getOrgAuth);
const findUniqueMock = vi.mocked(prisma.board.findUnique);
const notFoundMock = vi.mocked(notFound);
const redirectMock = vi.mocked(redirect);

const layoutProps = (boardId: string, children: ReactNode = null) =>
  ({
    children,
    params: Promise.resolve({ boardId }),
  }) as LayoutProps<"/board/[boardId]">;

describe("generateMetadata", () => {
  test("returns Board without querying when there is no orgId", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const metadata = await generateMetadata(layoutProps("board_1"));

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(metadata).toStrictEqual({ title: "Board" });
  });

  test("loads the board title for the active org", async () => {
    const board = boardFactory.build({ orgId: "org_1", title: "Roadmap" });
    getOrgAuthMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(board);

    const metadata = await generateMetadata(layoutProps(board.id));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(metadata).toStrictEqual({ title: "Roadmap" });
  });

  test("returns Board when the row is missing for this org", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    getOrgAuthMock.mockResolvedValue(null);

    await expect(BoardIdLayout(layoutProps("board_1"))).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(paths.selectOrg);
  });

  test("notFounds when the board is missing for this org", async () => {
    getOrgAuthMock.mockResolvedValue(orgAuth);
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
    getOrgAuthMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(board);

    const result = await BoardIdLayout(layoutProps(board.id, "child"));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: board.id, orgId: "org_1" },
    });
    expect(result).toBeTruthy();
  });
});
