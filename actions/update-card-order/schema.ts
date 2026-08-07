import * as z from "zod";

export const UpdateCardOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().trim(),
      title: z.string().trim(),
      order: z.number(),
      listId: z.string().trim(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  boardId: z.string().trim(),
});
