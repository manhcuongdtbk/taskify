import * as z from "zod";

export const DeleteBoardSchema = z.object({
  id: z.string().trim(),
});
