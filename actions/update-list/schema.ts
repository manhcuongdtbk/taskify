import { z } from "zod";

export const UpdateList = z.object({
  title: z.string().min(3),
  id: z.string(),
  boardId: z.string(),
});
