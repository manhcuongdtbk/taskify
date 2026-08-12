import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";
import { cardWithListArgs } from "@/lib/prisma/payloads";

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
      ...cardWithListArgs,
    });

    // TODO: return 404 when `card` is null (deleted or another org) instead of
    // a 200 null body — clients cannot tell "missing" from "empty", and
    // lib/api/card.ts has to widen the type to `CardWithList | null` to match.
    return NextResponse.json(card);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
