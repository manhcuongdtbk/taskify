import * as z from "zod";

export const DeleteCardSchema = z.object({
  id: z.string().trim(),
  boardId: z.string().trim(),
});
