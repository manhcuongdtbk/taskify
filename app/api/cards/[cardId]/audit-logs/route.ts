import { ENTITY_TYPE } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cards/[cardId]/audit-logs">,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { cardId } = await params;

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
