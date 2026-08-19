import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma/client";
import Link from "next/link";
import { SkeletonStatus } from "@/components/skeleton-status";
import { Skeleton } from "@/components/ui/skeleton";
import { User2 } from "lucide-react";
import { paths } from "@/lib/paths";
import { cssUrl } from "@/lib/utils";
import { CreateBoardTile } from "./create-board-tile";

export const BoardList = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    redirect(paths.selectOrg);
  }

  const boards = await prisma.board.findMany({
    where: {
      orgId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center text-lg font-semibold text-neutral-700">
        <User2 className="mr-2 h-6 w-6" />
        Your boards
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {boards.map((board) => (
          <Link
            href={paths.board(board.id)}
            key={board.id}
            style={{ backgroundImage: cssUrl(board.imageThumbUrl) }}
            className="group relative aspect-video h-full w-full overflow-hidden rounded-sm bg-sky-700 bg-cover bg-center bg-no-repeat p-2"
          >
            <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />
            <p className="relative font-semibold text-white">{board.title}</p>
          </Link>
        ))}
        <CreateBoardTile />
      </div>
    </div>
  );
};

BoardList.Skeleton = function BoardListSkeleton() {
  return (
    <SkeletonStatus
      heading="boards"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
    </SkeletonStatus>
  );
};
