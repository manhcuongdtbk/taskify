import { z } from "zod";

export const UpdateBoard = z.object({
  title: z.string().min(3),
  id: z.string(),
});
