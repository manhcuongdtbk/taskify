import * as z from "zod";

export const UpdateBoardSchema = z.object({
  title: z.string().trim().min(3),
  id: z.string().trim(),
});
