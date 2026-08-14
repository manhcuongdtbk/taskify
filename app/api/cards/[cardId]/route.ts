import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";
import { cardWithListTitleArgs } from "@/lib/prisma/query-options/card";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cards/[cardId]">,
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId } = await params;

    const card = await prisma.card.findUnique({
      where: { id: cardId, list: { board: { orgId } } },
      ...cardWithListTitleArgs,
    });

    // TODO: return 404 when `card` is null (deleted or another org) instead of
    // a 200 null body — clients cannot tell "missing" from "empty", and
    // lib/api/card has to widen the type to `CardWithListTitle | null` to match.
    return NextResponse.json(card);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
