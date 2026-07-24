"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBoard(id: string) {
  await prisma.board.delete({
    where: { id },
  });

  revalidatePath("/organization/[organizationId]"); // TODO: make this work with dynamic routes
}
