import * as z from "zod";

export const CopyListSchema = z.object({
  id: z.string().trim(),
  boardId: z.string().trim(),
});
