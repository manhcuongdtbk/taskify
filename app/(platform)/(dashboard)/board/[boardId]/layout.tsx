import prisma from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BoardNavbar } from "./_components/board-navbar";
import { paths } from "@/lib/paths";
import { cssUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: LayoutProps<"/board/[boardId]">): Promise<Metadata> {
  const { orgId } = await auth();

  if (!orgId) {
    return { title: "Board" };
  }

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  return {
    title: board?.title || "Board",
  };
}

export default async function BoardIdLayout({
  children,
  params,
}: LayoutProps<"/board/[boardId]">) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect(paths.selectOrg);
  }

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  if (!board) {
    notFound();
  }

  return (
    <div
      style={{ backgroundImage: cssUrl(board.imageFullUrl) }}
      className="relative h-full bg-cover bg-center bg-no-repeat"
    >
      <BoardNavbar board={board} />
      <div className="absolute inset-0 bg-black/10" />
      <main className="relative h-full pt-28">{children}</main>
    </div>
  );
}
