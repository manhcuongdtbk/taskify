"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateBoard = z.object({
  title: z.string(),
});

export async function create(formData: FormData) {
  const { title } = CreateBoard.parse({ title: formData.get("title") });

  await prisma.board.create({
    data: {
      title,
    },
  });

  revalidatePath("/organization/[organizationId]"); // TODO: make this work with dynamic routes
}
