"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = {
  errors?: {
    title?: string[];
  };
  message?: string | null;
};

const CreateBoard = z.object({
  title: z
    .string()
    .min(3, { error: "Minimum length of 3 letters is required" }),
});

export async function create(prevState: State, formData: FormData) {
  const validatedFields = CreateBoard.safeParse({
    title: formData.get("title"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors, // TODO: upgrade zod related code to use non deprecated code. More info: https://zod.dev/v4/changelog?id=deprecates-flatten#deprecates-flatten
      message: "Missing fields.",
    };
  }

  const { title } = validatedFields.data;

  try {
    await prisma.board.create({
      data: {
        title,
      },
    });
  } catch (error) {
    return {
      message: "Database Error",
    };
  }

  revalidatePath("/organization/[organizationId]"); // TODO: make this work with dynamic routes
  redirect("/organization/[organizationId]"); // TODO: make this work with dynamic routes
}
