import * as z from "zod";

export const UpdateListSchema = z.object({
  title: z.string().trim().min(3),
  id: z.string().trim(),
  boardId: z.string().trim(),
});
