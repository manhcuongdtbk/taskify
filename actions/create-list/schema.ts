import { z } from "zod";

export const CreateList = z.object({
  title: z.string().min(3),
  boardId: z.string(),
});
