import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { orgId } = await auth();

  if (!orgId) {
    return { title: "Board" };
  }

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
    },
  });

  return {
    title: board?.title || "Board",
  };
}

export default async function BoardIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ boardId: string }>;
}) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/select-org");
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
      style={{ backgroundImage: `url(${board.imageFullUrl})` }}
      className="relative h-full bg-cover bg-center bg-no-repeat"
    >
      <main className="relative h-full pt-28">{children}</main>
    </div>
  );
}
