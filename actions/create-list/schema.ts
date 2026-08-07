import * as z from "zod";

export const CreateListSchema = z.object({
  title: z.string().trim().min(3),
  boardId: z.string().trim(),
});
