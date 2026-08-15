import { ENTITY_TYPE } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

// 401 via NextResponse; missing card via notFound(). Do not wrap this GET in
// try/catch (swallows notFound). Other throws: docs/nextjs.md.
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cards/[cardId]/audit-logs">,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId, list: { board: { orgId } } },
    select: { id: true },
  });

  if (!card) {
    notFound();
  }

  const cardAuditLogs = await prisma.auditLog.findMany({
    where: {
      orgId,
      entityId: cardId,
      entityType: ENTITY_TYPE.CARD,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  return NextResponse.json(cardAuditLogs);
}
