import * as z from "zod";

export const UpdateCardSchema = z.object({
  boardId: z.string().trim(),
  description: z.optional(z.string().trim().min(3)),
  title: z.optional(z.string().trim().min(3)),
  id: z.string().trim(),
});
