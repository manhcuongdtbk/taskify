import * as z from "zod";

export const CreateCardSchema = z.object({
  title: z.string().trim().min(3),
  boardId: z.string().trim(),
  listId: z.string().trim(),
});
