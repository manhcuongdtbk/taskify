import { ENTITY_TYPE } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma/client";
import { getOrgAuth } from "@/lib/auth/get-org-auth";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

// 401 via NextResponse; missing card via notFound(). Do not wrap this GET in
// try/catch (swallows notFound). Other throws: docs/nextjs.md.
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cards/[cardId]/audit-logs">,
) {
  const orgId = (await getOrgAuth())?.orgId;

  if (!orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { cardId } = await params;

  // Existence then logs in one interactive transaction so a missing card
  // (or other org) skips findMany. notFound() stays outside — a throw inside
  // $transaction is a rollback, not a 404. docs/prisma.md · docs/data.md
  const cardAuditLogs = await prisma.$transaction(async (tx) => {
    const card = await tx.card.findUnique({
      where: { id: cardId, list: { board: { orgId } } },
      select: { id: true },
    });

    if (!card) {
      return null;
    }

    return tx.auditLog.findMany({
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
  });

  if (!cardAuditLogs) {
    notFound();
  }

  return NextResponse.json(cardAuditLogs);
}
