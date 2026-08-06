import { z } from "zod";

export const UpdateCard = z.object({
  boardId: z.string(),
  description: z.optional(z.string().min(3)),
  title: z.optional(z.string().min(3)),
  id: z.string(),
});
