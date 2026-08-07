import * as z from "zod";

export const DeleteListSchema = z.object({
  id: z.string().trim(),
  boardId: z.string().trim(),
});
