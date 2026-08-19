import { notFound } from "next/navigation";
import { NextRequest } from "next/server";
import { describe, expect, test, vi } from "vitest";

import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { cardWithListTitleArgs } from "@/lib/prisma/query-options/card";
import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
import { orgAuth } from "@/lib/testing/auth/org-auth";
import { jsonBody } from "@/lib/testing/json-body";

vi.mock("@/lib/prisma/client");

vi.mock("@/lib/auth/get-org-auth");

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { GET } from "./route";

const getOrgAuthMock = vi.mocked(getOrgAuth);
const findUniqueMock = vi.mocked(prisma.card.findUnique);
const notFoundMock = vi.mocked(notFound);

const request = new NextRequest("http://localhost/api/cards/card_1");

const contextFor = (cardId: string) => ({
  params: Promise.resolve({ cardId }),
});

describe("GET /api/cards/[cardId]", () => {
  test("returns 401 without querying when there is no session", async () => {
    getOrgAuthMock.mockResolvedValue(null);

    const response = await GET(request, contextFor("card_1"));

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("returns the card when it exists in this org", async () => {
    const card = cardWithListTitleFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(card);

    const response = await GET(request, contextFor(card.id));

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      ...cardWithListTitleArgs,
    });
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(jsonBody(card));
  });

  test("calls notFound when the card is missing or in another org", async () => {
    const card = cardWithListTitleFactory.build();
    getOrgAuthMock.mockResolvedValue(orgAuth);
    findUniqueMock.mockResolvedValue(null);

    const error = await GET(request, contextFor(card.id)).then(
      () => {
        throw new Error("expected GET to reject");
      },
      (reason: unknown) => reason,
    );

    expect(findUniqueMock).toHaveBeenCalledExactlyOnceWith({
      where: { id: card.id, list: { board: { orgId: "org_1" } } },
      ...cardWithListTitleArgs,
    });
    expect(notFoundMock).toHaveBeenCalledOnce();
    expect(error).toMatchObject({ message: "NEXT_NOT_FOUND" });
  });
});
