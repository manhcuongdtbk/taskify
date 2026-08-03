import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      include: { list: { select: { title: true } } },
    });

    return NextResponse.json(card);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
