import prisma from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ListContainer } from "./_components/list-container";
import { paths } from "@/lib/paths";
import { listWithCardsArgs } from "@/lib/prisma/payloads";

export default async function BoardIdPage({
  params,
}: PageProps<"/board/[boardId]">) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect(paths.selectOrg);
  }

  const { boardId } = await params;

  const lists = await prisma.list.findMany({
    where: {
      boardId,
      board: {
        orgId,
      },
    },
    ...listWithCardsArgs,
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="h-full overflow-x-auto p-4">
      <ListContainer boardId={boardId} data={lists} />
    </div>
  );
}
