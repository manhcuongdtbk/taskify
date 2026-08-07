import * as z from "zod";

export const CopyCardSchema = z.object({
  id: z.string().trim(),
  boardId: z.string().trim(),
});
