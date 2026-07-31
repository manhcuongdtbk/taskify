import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ListContainer } from "./_components/list-container";

export default async function BoardIdPage({
  params,
}: PageProps<"/board/[boardId]">) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/select-org");
  }

  const { boardId } = await params;

  const lists = await prisma.list.findMany({
    where: {
      boardId,
      board: {
        orgId,
      },
    },
    include: {
      cards: {
        orderBy: {
          order: "asc",
        },
      },
    },
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
