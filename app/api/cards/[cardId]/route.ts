import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";
import { cardWithListTitleArgs } from "@/lib/prisma/query-options/card";

// 401 via NextResponse; missing card via notFound(). Do not wrap this GET in
// try/catch (swallows notFound). Other throws: docs/nextjs.md.
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cards/[cardId]">,
) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId, list: { board: { orgId } } },
    ...cardWithListTitleArgs,
  });

  if (!card) {
    notFound();
  }

  return NextResponse.json(card);
}
